// src/routes/authRoutes.js - Định nghĩa endpoints authentication
import express from 'express';
const router = express.Router();
import { register, login, googleLogin, facebookLogin, logout, refreshAccessToken, changePassword, forgotPassword, resetPassword } from './auth.controller.js';
import { authenticateToken } from '../../core/middlewares/auth.js';
import { createAdmin } from '../admin/admin.controller.js';


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - language
 *               - proficiencyLevel
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               country:
 *                 type: string
 *                 example: "vi"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Lỗi dữ liệu
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công và trả về token
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Đăng nhập bằng Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập hoặc tạo mới thành công
 *       400:
 *         description: Thiếu idToken
 */
router.post('/google', googleLogin);

/**
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     summary: Đăng nhập bằng Facebook
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập hoặc tạo mới thành công
 *       400:
 *         description: Thiếu accessToken
 */
router.post('/facebook', facebookLogin);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng (xóa refreshToken cookie)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/token:
 *   post:
 *     summary: Làm mới access token bằng refresh token trong cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Trả về access token mới
 *       401:
 *         description: Không tìm thấy refresh token
 *       403:
 *         description: Refresh token không hợp lệ
 */
router.post('/token', refreshAccessToken);

/**
 * @swagger
 * /api/auth/password/change:
 *   patch:
 *     summary: Thay đổi mật khẩu
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Sai mật khẩu cũ
 */
router.patch('/password/change', authenticateToken, changePassword);

/**
 * @swagger
 * /api/auth/password/forgot:
 *   post:
 *     summary: Yêu cầu lấy lại mật khẩu (gửi mã OTP qua email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email đã được gửi
 *       404:
 *         description: Không tìm thấy email
 */
router.post('/password/forgot', forgotPassword);

/**
 * @swagger
 * /api/auth/password/reset:
 *   post:
 *     summary: Đặt lại mật khẩu sử dụng mã OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Mã OTP sai hoặc hết hạn
 */
router.post('/password/reset', resetPassword);

/**
 * @swagger
 * /api/auth/create:
 *   post:
 *     summary: Tạo tài khoản Admin mới (Chỉ Admin)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo tài khoản Admin thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/create', createAdmin);

export default router;
