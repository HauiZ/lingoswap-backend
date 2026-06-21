import { Router } from "express";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.get('/unread/count', authenticateToken, getUnreadCount);
router.patch('/', authenticateToken, markAllAsRead);
router.patch('/:notificationId/status', authenticateToken, markAsRead);

export default router;
