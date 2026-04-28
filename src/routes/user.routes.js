import express from 'express';
const router = express.Router();
import { getMyProfile, getUserById, updateMyProfile, uploadAvatar, getDashboard } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { uploadImage } from '../middlewares/upload.js';

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Lấy hồ sơ cá nhân
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 */
router.get('/me', authenticateToken, getMyProfile);

/**
 * @swagger
 * /api/users/dashboard:
 *   get:
 *     summary: Lấy dữ liệu tổng quan cho trang chủ User
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin tổng quan (thống kê, lịch sử, gợi ý đối tác)
 */
router.get('/dashboard', authenticateToken, getDashboard);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy public profile của user khác
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin public user
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   country:
 *                     type: string
 *                   bio:
 *                     type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: User cập nhật thành công
 */
router.put('/me', authenticateToken, updateMyProfile);

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Tải lên avatar cá nhân (Hỗ trợ multipart/form-data)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar tải lên thành công trả về URL
 *       400:
 *         description: Vui lòng cung cấp file ảnh
 */
router.post('/avatar', authenticateToken, uploadImage.single('avatar'), uploadAvatar);

export default router;
