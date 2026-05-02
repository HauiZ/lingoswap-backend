import authService from './auth.service.js';
import logger from '../../core/utils/logger.js';
import sendTokenResponse from '../../core/utils/sendTokenResponse.js';

// Đăng ký người dùng mới
const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    sendTokenResponse(user, 201, res);
    logger.log(`Tạo user mới thành công: ${user.email}`);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server khi đăng ký' });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const user = await authService.login(req.body);
    sendTokenResponse(user, 200, res);
    logger.log(`User đăng nhập: ${user.email}`);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server khi đăng nhập' });
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
    const newAccessToken = await authService.refreshAccessTokenService(refreshToken);
    res.json({ token: newAccessToken });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server khi làm mới token' });
  }
};

// Thay đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const user = await authService.changePassword(req.user.id, req.body);
    logger.log(`Đổi mật khẩu thành công cho user ID: ${user._id}`);
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server khi thay đổi mật khẩu' });
  }
};

// Yêu cầu lấy mã OTP quên mật khẩu
const forgotPassword = async (req, res) => {
  try {
    const user = await authService.forgotPassword(req.body);
    res.status(200).json({ message: 'Email đã được gửi' });
    logger.log(`Đã gửi OTP đến email: ${user.email}`);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server khi yêu cầu quên mật khẩu' });
  }
};

// Đặt lại mật khẩu với OTP
const resetPassword = async (req, res) => {
  try {
    const user = await authService.resetPassword(req.body);
    logger.log(`Đặt lại mật khẩu thành công cho email: ${user.email}`);
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server khi đặt lại mật khẩu' });
  }
};

// Đăng nhập bằng Google
const googleLogin = async (req, res) => {
  try {
    const { user, isNewUser } = await authService.googleLogin(req.body);
    if (isNewUser) {
      logger.log(`Tạo mới user từ Google: ${user.email}`);
    }
    // Cấp phát token
    sendTokenResponse(user, 200, res);
    logger.log(`User đăng nhập qua Google: ${user.email}`);
  } catch (error) {
    logger.error(`Lỗi Google login: ${error.message}`);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server khi đăng nhập bằng Google' });
  }
};

// Đăng nhập bằng Facebook
const facebookLogin = async (req, res) => {
  try {
    const { user, isNewUser } = await authService.facebookLogin(req.body);
    if (isNewUser) {
        logger.log(`Tạo mới user từ Facebook: ${user.email}`);
    }
    // Cấp phát token
    sendTokenResponse(user, 200, res);
    logger.log(`User đăng nhập qua Facebook: ${user.email}`);
  } catch (error) {
    logger.error(`Lỗi Facebook login: ${error.message}`);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server khi đăng nhập bằng Facebook' });
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
