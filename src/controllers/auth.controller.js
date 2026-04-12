import User from '../models/User.js';
import OTP from '../models/OTP.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import sendEmail from '../utils/sendEmail.js';
import logger from '../utils/logger.js';
import { validatePassword, validateEmail, validateUsername } from '../utils/validators.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import sendTokenResponse from '../helper/sendTokenResponse.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Đăng ký người dùng mới
const register = async (req, res) => {
  try {
    const { email, password, confirmPassword, fullName, country } = req.body;

    if (!email || !password || !confirmPassword || !fullName || !country) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      });
    }

    if (!validateUsername(fullName)) {
      return res.status(400).json({ error: 'Tên không hợp lệ' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu không khớp' });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Băm mật khẩu (Hash password)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu user vào DB
    const user = await User.create({
      email,
      password: hashedPassword,
      profile: {
        fullName,
        country
      }
    });

    if (user) {
      sendTokenResponse(user, 201, res);
      logger.log(`Tạo user mới thành công: ${user.email}`);
    } else {
      res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      if (user.statusAccount === 'banned') {
        return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
      }
      sendTokenResponse(user, 200, res);
      logger.log(`User đăng nhập: ${user.email}`);
    } else {
      res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};

// Đăng xuất
const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ message: 'Đăng xuất thành công' });
};

// Làm mới accessToken
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Không tìm thấy refresh token, vui lòng đăng nhập lại' });
    }

    jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn' });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }

      const newAccessToken = generateAccessToken(user._id, user.role);
      res.json({ token: newAccessToken });
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi server khi làm mới token' });
  }
};

// Thay đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // req.user được gán từ middleware auth
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra mật khẩu cũ
    if (!user.password) {
      return res.status(400).json({ error: 'Tài khoản MXH không có mật khẩu. Vui lòng sử dụng chức năng quên mật khẩu.' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'Mật khẩu thay đổi phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      });
    }

    // Băm mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    logger.log(`Đổi mật khẩu thành công cho user ID: ${user._id}`);
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi server khi thay đổi mật khẩu' });
  }
};

// Yêu cầu lấy mã OTP quên mật khẩu
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng có email này' });
    }

    // Tạo mã OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu mã này vào Collection OTP
    await OTP.create({
      email: user.email,
      otpCode: otp,
      type: 'forgot_password',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Gửi email
    const message = `Bạn đã yêu cầu đặt lại mật khẩu. \n\nMã OTP của bạn là: ${otp}. \n\nMã này sẽ hết hạn trong 10 phút.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'LingoSwap - Mã OTP Đặt Lại Mật Khẩu',
        message: message,
      });

      res.status(200).json({ message: 'Email đã được gửi' });
      logger.log(`Đã gửi OTP đến email: ${user.email}`);
    } catch (err) {
      logger.error('Lỗi khi gửi email:', err);
      return res.status(500).json({ error: 'Không thể gửi email OTP, vui lòng thử lại sau.' });
    }
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi server khi yêu cầu quên mật khẩu' });
  }
};

// Đặt lại mật khẩu với OTP
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const validOtp = await OTP.findOne({
      email,
      otpCode: otp,
      type: 'forgot_password',
      expiresAt: { $gt: Date.now() },
      isUsed: false
    });

    if (!validOtp) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      });
    }

    // Cập nhật mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Đánh dấu OTP đã sử dụng
    validOtp.isUsed = true;
    await validOtp.save();

    logger.log(`Đặt lại mật khẩu thành công cho email: ${user.email}`);
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi server khi đặt lại mật khẩu' });
  }
};

// Đăng nhập bằng Google
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Thiếu idToken' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();

    let user = await User.findOne({ email });

    if (!user) {
      // Người dùng mới qua Google
      user = await User.create({
        email,
        authProvider: 'google',
        providerId: payload.sub,
        profile: {
          fullName: payload.name || 'Người dùng Google',
          avatar: payload.picture || 'default_avatar.png',
        }
      });
      logger.log(`Tạo mới user từ Google: ${email}`);
    }

    // Cấp phát token
    sendTokenResponse(user, 200, res);
    logger.log(`User đăng nhập qua Google: ${user.email}`);
  } catch (error) {
    logger.error(`Lỗi Google login: ${error.message}`);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập bằng Google' });
  }
};

// Đăng nhập bằng Facebook
const facebookLogin = async (req, res) => {
  try {
    const { accessToken: fbAccessToken } = req.body;
    if (!fbAccessToken) {
      return res.status(400).json({ error: 'Thiếu accessToken của Facebook' });
    }

    // Gọi Graph API để lấy thông tin
    const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${fbAccessToken}`);

    if (!data || !data.id) {
      return res.status(400).json({ error: 'Token Facebook không hợp lệ' });
    }

    // Facebook có thể không trả về email, lúc này ta tạo email tạm
    const email = data.email ? data.email.toLowerCase() : `${data.id}@facebook.com`;

    let user = await User.findOne({ email });

    if (!user) {
      // Người dùng mới qua Facebook
      user = await User.create({
        email,
        authProvider: 'facebook',
        providerId: data.id,
        profile: {
          fullName: data.name || 'Người dùng Facebook',
          avatar: data.picture?.data?.url || 'default_avatar.png',
        }
      });
      logger.log(`Tạo mới user từ Facebook: ${email}`);
    }

    // Cấp phát token
    sendTokenResponse(user, 200, res);
    logger.log(`User đăng nhập qua Facebook: ${user.email}`);
  } catch (error) {
    logger.error(`Lỗi Facebook login: ${error.response?.data?.error?.message || error.message}`);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập bằng Facebook' });
  }
};

export {
  register,
  login,
  googleLogin,
  facebookLogin,
  logout,
  refreshAccessToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
