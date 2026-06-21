import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import User from '../entities/User.js';
import OTP from '../entities/OTP.js';
import redis from '../config/redis.js';
import env from '../config/env.js';
import eventBus from '../config/eventBus.js';
import { EventTypes } from '../events/eventTypes.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import { renderEmailTemplate } from '../utils/emailTemplate.js';
import ApiError from '../utils/ApiError.js';

const googleClient = new OAuth2Client(env.OAUTH_CLIENT_ID);

// ─── Register ────────────────────────────────────────────────────
const register = async ({ email, password, confirmPassword, fullName, country }) => {
  if (!email || !password || !confirmPassword || !fullName || !country) {
    throw new ApiError(400, 'Vui lòng cung cấp đầy đủ thông tin bắt buộc');
  }
  if (!validateEmail(email)) throw new ApiError(400, 'Email không hợp lệ');
  if (!validatePassword(password)) {
    throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
  }
  if (password !== confirmPassword) throw new ApiError(400, 'Mật khẩu không khớp');

  const userExists = await User.findOne({ email });
  if (userExists) throw new ApiError(400, 'Email đã được sử dụng');

  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
  const user = await User.create({
    email,
    password: hashedPassword,
    profile: { fullName, country },
  });

  if (!user) throw new ApiError(400, 'Dữ liệu không hợp lệ');

  // Publish event để User Service tạo full profile
  await eventBus.publish(EventTypes.USER_CREATED, {
    userId:   user._id.toString(),
    email:    user.email,
    profile:  { fullName, country },
    role:     user.role,
    authProvider: 'local',
  });

  return user;
};

// ─── Login ───────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Email hoặc mật khẩu không chính xác');
  }
  if (user.statusAccount === 'banned') throw new ApiError(403, 'Tài khoản đã bị khóa');
  return user;
};

// ─── Refresh Access Token ────────────────────────────────────────
const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) throw new ApiError(401, 'Không tìm thấy refresh token, vui lòng đăng nhập lại');

  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return reject(new ApiError(403, 'Refresh token không hợp lệ hoặc đã hết hạn'));
      try {
        const user = await User.findById(decoded.id);
        if (!user) return reject(new ApiError(404, 'Không tìm thấy người dùng'));
        resolve(generateAccessToken(user._id, user.role));
      } catch (error) {
        reject(error);
      }
    });
  });
};

// ─── Change Password ─────────────────────────────────────────────
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
  if (!user.password) throw new ApiError(400, 'Tài khoản MXH không có mật khẩu. Vui lòng sử dụng chức năng quên mật khẩu.');

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new ApiError(400, 'Mật khẩu hiện tại không chính xác');
  if (!validatePassword(newPassword)) {
    throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
  }

  user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
  await user.save();
  return user;
};

// ─── Forgot Password ─────────────────────────────────────────────
const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng có email này');

  // Rate limiter: tối đa 3 lần / 5 phút per email
  const emailKey = `otp_limit:${email.toLowerCase()}`;
  const requestCount = await redis.get(emailKey);
  if (requestCount) {
    if (parseInt(requestCount, 10) >= 3) throw new ApiError(429, 'Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng thử lại sau.');
    await redis.incr(emailKey);
  } else {
    await redis.set(emailKey, 1, 'EX', 300);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await OTP.create({
    email: user.email,
    otpCode: otp,
    type: 'forgot_password',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  const html = renderEmailTemplate('otp', { fullName: user.profile.fullName, otpCode: otp });
  await sendEmail({
    email: user.email,
    subject: 'LingoSwap - Mã OTP Đặt Lại Mật Khẩu',
    message: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn trong 5 phút.`,
    html,
  });

  return user;
};

// ─── Reset Password ──────────────────────────────────────────────
const resetPassword = async ({ email, otp, newPassword }) => {
  const validOtp = await OTP.findOne({
    email,
    otpCode: otp,
    type: 'forgot_password',
    expiresAt: { $gt: Date.now() },
    isUsed: false,
  });
  if (!validOtp) throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
  if (!validatePassword(newPassword)) throw new ApiError(400, 'Mật khẩu mới không đáp ứng yêu cầu');

  user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
  await user.save();

  validOtp.isUsed = true;
  await validOtp.save();
  return user;
};

// ─── Google Login ────────────────────────────────────────────────
const googleLogin = async ({ idToken, accessToken: googleAccessToken }) => {
  if (!idToken && !googleAccessToken) throw new ApiError(400, 'Thiếu idToken hoặc accessToken của Google');

  let payload = {};
  if (googleAccessToken) {
    try {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      payload = { email: data.email, name: data.name, picture: data.picture, sub: data.sub };
    } catch {
      throw new ApiError(400, 'Google accessToken không hợp lệ hoặc đã hết hạn');
    }
  } else {
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: env.OAUTH_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      throw new ApiError(400, 'Google idToken không hợp lệ hoặc cấu hình sai Client ID');
    }
  }

  if (!payload.email) throw new ApiError(400, 'Không thể lấy thông tin email từ tài khoản Google này');
  const email = payload.email.toLowerCase();

  let user = await User.findOne({ email });
  if (user?.statusAccount === 'banned') throw new ApiError(400, 'Tài khoản của bạn đã bị khóa');

  let isNewUser = false;
  if (!user) {
    user = await User.create({
      email,
      authProvider: 'google',
      providerId: payload.sub,
      profile: {
        fullName: payload.name || 'Người dùng Google',
        avatar: payload.picture || 'default_avatar.png',
      },
    });
    isNewUser = true;

    // Publish event để User Service tạo profile
    await eventBus.publish(EventTypes.USER_CREATED, {
      userId:      user._id.toString(),
      email:       user.email,
      profile:     user.profile,
      role:        user.role,
      authProvider: 'google',
    });
  }

  return { user, isNewUser };
};

// ─── Facebook Login ───────────────────────────────────────────────
const facebookLogin = async ({ accessToken: fbAccessToken }) => {
  if (!fbAccessToken) throw new ApiError(400, 'Thiếu accessToken của Facebook');

  const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${fbAccessToken}`);
  if (!data?.id) throw new ApiError(400, 'Token Facebook không hợp lệ');

  const email = data.email ? data.email.toLowerCase() : `${data.id}@facebook.com`;
  let user = await User.findOne({ email });

  let isNewUser = false;
  if (!user) {
    user = await User.create({
      email,
      authProvider: 'facebook',
      providerId: data.id,
      profile: {
        fullName: data.name || 'Người dùng Facebook',
        avatar: data.picture?.data?.url || 'default_avatar.png',
      },
    });
    isNewUser = true;

    await eventBus.publish(EventTypes.USER_CREATED, {
      userId:      user._id.toString(),
      email:       user.email,
      profile:     user.profile,
      role:        user.role,
      authProvider: 'facebook',
    });
  }

  return { user, isNewUser };
};

export default {
  register,
  login,
  refreshAccessTokenService,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  facebookLogin,
};
