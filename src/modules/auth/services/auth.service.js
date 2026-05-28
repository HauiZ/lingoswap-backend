import User from '../../users/entities/User.js';
import OTP from '../entities/OTP.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../../../core/config/env.js';
import sendEmail from '../../../core/utils/sendEmail.js';
import renderEmailTemplate from '../../../core/utils/emailTemplate.js';
import ApiError from '../../../core/utils/ApiError.js';
import { validatePassword, validateEmail } from '../../../core/utils/validators.js';
import { generateAccessToken } from '../../../core/utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

const googleClient = new OAuth2Client(env.OAUTH_CLIENT_ID);

const register = async ({ email, password, confirmPassword, fullName, country }) => {
    if (!email || !password || !confirmPassword || !fullName || !country) {
        throw new ApiError(400, 'Vui lòng cung cấp đầy đủ thông tin bắt buộc');
    }

    if (!validateEmail(email)) {
        throw new ApiError(400, 'Email không hợp lệ');
    }

    if (!validatePassword(password)) {
        throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, 'Mật khẩu không khớp');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new ApiError(400, 'Email đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        email,
        password: hashedPassword,
        profile: {
            fullName,
            country
        }
    });

    if (!user) {
        throw new ApiError(400, 'Dữ liệu không hợp lệ');
    }

    return user;
};

const login = async ({ email, password }) => {
    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
        if (user.statusAccount === 'banned') {
            throw new ApiError(403, 'Tài khoản đã bị khóa');
        }
        return user;
    } else {
        throw new ApiError(401, 'Email hoặc mật khẩu không chính xác');
    }
};

const refreshAccessTokenService = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(401, 'Không tìm thấy refresh token, vui lòng đăng nhập lại');
    }

    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return reject(new ApiError(403, 'Refresh token không hợp lệ hoặc đã hết hạn'));
            }

            try {
                const user = await User.findById(decoded.id);
                if (!user) {
                    return reject(new ApiError(404, 'Không tìm thấy người dùng'));
                }

                const newAccessToken = generateAccessToken(user._id, user.role);
                resolve(newAccessToken);
            } catch (error) {
                reject(error);
            }
        });
    });
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    if (!user.password) {
        throw new ApiError(400, 'Tài khoản MXH không có mật khẩu. Vui lòng sử dụng chức năng quên mật khẩu.');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new ApiError(400, 'Mật khẩu hiện tại không chính xác');
    }

    if (!validatePassword(newPassword)) {
        throw new ApiError(400, 'Mật khẩu thay đổi phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    return user;
};

const forgotPassword = async ({ email }) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, 'Không tìm thấy người dùng có email này');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.create({
        email: user.email,
        otpCode: otp,
        type: 'forgot_password',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    const message = `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn trong 5 phút.`;

    const html = renderEmailTemplate('otp', {
        fullName: user.profile.fullName,
        otpCode: otp
    });

    try {
        await sendEmail({
            email: user.email,
            subject: 'LingoSwap - Mã OTP Đặt Lại Mật Khẩu',
            message,
            html
        });
        return user;
    } catch (err) {
        throw new ApiError(500, 'Không thể gửi email OTP, vui lòng thử lại sau.');
    }
};

const resetPassword = async ({ email, otp, newPassword }) => {
    const validOtp = await OTP.findOne({
        email,
        otpCode: otp,
        type: 'forgot_password',
        expiresAt: { $gt: Date.now() },
        isUsed: false
    });

    if (!validOtp) {
        throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'Không tìm thấy người dùng');
    }

    if (!validatePassword(newPassword)) {
        throw new ApiError(400, 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    validOtp.isUsed = true;
    await validOtp.save();

    return user;
};

const googleLogin = async ({ idToken, accessToken }) => {
    if (!idToken && !accessToken) {
        throw new ApiError(400, 'Thiếu idToken hoặc accessToken của Google');
    }

    let payload = {};

    if (accessToken) {
        // Trường hợp Frontend dùng useGoogleLogin (trả về access_token bắt đầu bằng ya29...)
        try {
            const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            payload = {
                email: data.email,
                name: data.name,
                picture: data.picture,
                sub: data.sub
            };
        } catch (error) {
            throw new ApiError(400, 'Google accessToken không hợp lệ hoặc đã hết hạn');
        }
    } else {
        // Trường hợp Frontend dùng component <GoogleLogin /> (trả về idToken/credential bắt đầu bằng eyJ...)
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: env.OAUTH_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (error) {
            throw new ApiError(400, 'Google idToken không hợp lệ hoặc cấu hình sai Client ID');
        }
    }

    if (!payload.email) {
        throw new ApiError(400, 'Không thể lấy thông tin email từ tài khoản Google này');
    }

    const email = payload.email.toLowerCase();

    let user = await User.findOne({ email });
    if (user && user.statusAccount === 'banned') {
        throw new ApiError(400, 'Tài khoản của bạn đã bị khóa');
    }

    let isNewUser = false;
    if (!user) {
        user = await User.create({
            email,
            authProvider: 'google',
            providerId: payload.sub,
            profile: {
                fullName: payload.name || 'Người dùng Google',
                avatar: payload.picture || 'default_avatar.png',
            }
        });
        isNewUser = true;
    }

    return { user, isNewUser };
};

const facebookLogin = async ({ accessToken }) => {
    if (!accessToken) {
        throw new ApiError(400, 'Thiếu accessToken của Facebook');
    }

    const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);

    if (!data || !data.id) {
        throw new ApiError(400, 'Token Facebook không hợp lệ');
    }

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
            }
        });
        isNewUser = true;
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
    facebookLogin
};
