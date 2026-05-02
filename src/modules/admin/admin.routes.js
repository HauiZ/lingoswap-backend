import express from 'express';
const router = express.Router();
import { getAllUsers, banUser, deleteUser, getReports, resolveReport, getDashboard, getAppeals, resolveAppeal } from './admin.controller.js';
import { authenticateToken, authorizeRoles } from '../../core/middlewares/auth.js';

router.use(authenticateToken, authorizeRoles('admin'));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Lấy thống kê tổng quan hệ thống (Dashboard)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về toàn bộ số liệu thống kê của hệ thống
 */
router.get('/dashboard', getDashboard);

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

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Lấy danh sách toàn bộ báo cáo vi phạm (Có phân trang và lọc trạng thái)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Trạng thái (pending, investigating, resolved, dismissed)
 *     responses:
 *       200:
 *         description: Trả về danh sách Reports
 */
router.get('/reports', getReports);

/**
 * @swagger
 * /api/admin/reports/{id}/status:
 *   patch:
 *     summary: Admin cập nhật trạng thái báo cáo và xử lý vi phạm
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "resolved"
 *               adminNotes:
 *                 type: string
 *                 example: "User gian lận, cấm 7 ngày"
 *               banDuration:
 *                 type: string
 *                 description: "Độ dài cấm tải khoản nếu có (3_days, '7_days', '30_days', 'permanent')"
 *     responses:
 *       200:
 *         description: Trả về thông tin báo cáo đã cập nhật
 */
router.patch('/reports/:id/status', resolveReport);

/**
 * @swagger
 * /api/admin/appeals:
 *   get:
 *     summary: Lấy danh sách đơn kháng cáo
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách đơn kháng cáo
 */
router.get('/appeals', getAppeals);

/**
 * @swagger
 * /api/admin/appeals/{id}/resolve:
 *   put:
 *     summary: Xử lý đơn kháng cáo
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xử lý kháng cáo thành công
 */
router.put('/appeals/:id/resolve', resolveAppeal);

export default router;
