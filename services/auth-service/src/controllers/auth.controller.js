import authService from '../services/auth.service.js';
import logger from '../utils/logger.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

// Helper: tạo và gửi token response (access + refresh cookie)
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(statusCode).json({
    id:      user._id,
    email:   user.email,
    profile: user.profile,
    role:    user.role,
    token:   accessToken,
  });
};

// ─── Đăng ký ────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    sendTokenResponse(user, 201, res);
    logger.log(`[Auth] Register: ${user.email}`);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ─── Đăng nhập ──────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const user = await authService.login(req.body);
    sendTokenResponse(user, 200, res);
    logger.log(`[Auth] Login: ${user.email}`);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ─── Đăng xuất ──────────────────────────────────────────────────
const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Đăng xuất thành công' });
};

// ─── Làm mới access token ────────────────────────────────────────
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken  = req.cookies?.refreshToken;
    const newAccessToken = await authService.refreshAccessTokenService(refreshToken);
    res.json({ token: newAccessToken });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ─── Đổi mật khẩu ───────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    logger.log(`[Auth] Change password: user ${req.user.id}`);
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ─── Quên mật khẩu ──────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const user = await authService.forgotPassword(req.body);
    res.status(200).json({ message: 'Email đã được gửi' });
    logger.log(`[Auth] OTP sent to: ${user.email}`);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ─── Đặt lại mật khẩu ───────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const user = await authService.resetPassword(req.body);
    logger.log(`[Auth] Reset password: ${user.email}`);
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ─── Google Login ────────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { user, isNewUser } = await authService.googleLogin(req.body);
    if (isNewUser) logger.log(`[Auth] New user via Google: ${user.email}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`[Auth] Google login error: ${error.message}`);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// ─── Facebook Login ──────────────────────────────────────────────
const facebookLogin = async (req, res) => {
  try {
    const { user, isNewUser } = await authService.facebookLogin(req.body);
    if (isNewUser) logger.log(`[Auth] New user via Facebook: ${user.email}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`[Auth] Facebook login error: ${error.message}`);
    res.status(error.statusCode || 500).json({ error: error.message });
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
