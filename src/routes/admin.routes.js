// src/routes/admin.routes.js - Định nghĩa endpoints quản trị viên
import express from 'express';
const router = express.Router();
import { getAllUsers, banUser, deleteUser } from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

// Áp dụng middleware admin cho toàn bộ các route trong router này
router.use(authenticateToken, authorizeRoles('admin'));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Lấy danh sách tất cả users (Chỉ Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách users thành công
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}/ban:
 *   put:
 *     summary: Khóa (Ban) người dùng vì vi phạm (Chỉ Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã khóa (Ban) người dùng thành công
 */
router.put('/users/:id/ban', banUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn user (Chỉ Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/users/:id', deleteUser);

export default router;
