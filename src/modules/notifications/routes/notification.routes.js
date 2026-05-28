import { Router } from "express";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';
import { authenticateToken } from '../../../core/middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/user/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 */
router.get('/', authenticateToken, getNotifications);

/**
 * @swagger
 * /api/user/notifications/unread/count:
 *   get:
 *     summary: Lấy số lượng thông báo chưa đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Số lượng thông báo chưa đọc
 */
router.get('/unread/count', authenticateToken, getUnreadCount);

/**
 * @swagger
 * /api/user/notifications:
 *   patch:
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/', authenticateToken, markAllAsRead);

/**
 * @swagger
 * /api/user/notifications/{notificationId}/status:
 *   patch:
 *     summary: Đánh dấu 1 thông báo đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/:notificationId/status', authenticateToken, markAsRead);

export default router;
