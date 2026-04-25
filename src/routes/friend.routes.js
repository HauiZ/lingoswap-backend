import { Router } from "express";
import { getListFriends, sendFriendRequest, responseFriendRequest, getFriendRequests, removeFriend, checkFriendStatus } from "../controllers/friend.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = Router();

/**
 * @swagger
 * /api/user/friends/friends:
 *   get:
 *     summary: Lấy danh sách bạn bè
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bạn bè
 */
router.get('/friends', authenticateToken, getListFriends);

/**
 * @swagger
 * /api/user/friends/friends/requests:
 *   get:
 *     summary: Lấy danh sách yêu cầu kết bạn
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu kết bạn
 */
router.get('/friends/requests', authenticateToken, getFriendRequests);

/**
 * @swagger
 * /api/user/friends/friends/:recipientId/request:
 *   post:
 *     summary: Gửi yêu cầu kết bạn
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Yêu cầu kết bạn đã được gửi
 */
router.post('/friends/:recipientId/request', authenticateToken, sendFriendRequest);

/**
 * @swagger
 * /api/user/friends/friends/:requestId/response:
 *   patch:
 *     summary: Phản hồi yêu cầu kết bạn
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
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
 *                 enum: [accept, reject]
 *     responses:
 *       200:
 *         description: Yêu cầu kết bạn đã được phản hồi
 */
router.patch('/friends/:requestId/response', authenticateToken, responseFriendRequest);

/**
 * @swagger
 * /api/user/friends/friends/:friendId:
 *   delete:
 *     summary: Hủy kết bạn
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã hủy kết bạn
 */
router.delete('/friends/:friendId', authenticateToken, removeFriend);

/**
 * @swagger
 * /api/user/friends/friends/:targetUserId/status:
 *   get:
 *     summary: Kiểm tra trạng thái bạn bè với một người dùng khác
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trạng thái bạn bè (none, friends, request_sent, request_received)
 */
router.get('/friends/:targetUserId/status', authenticateToken, checkFriendStatus);

export default router;