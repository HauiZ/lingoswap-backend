import { Router } from "express";
import { sendFriendRequest, responseFriendRequest, getFriendRequests } from "../controllers/friend.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = Router();
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

export default router;