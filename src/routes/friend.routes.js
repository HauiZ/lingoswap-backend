import { Router } from "express";
import { sendFriendRequest, responseFriendRequest, getFriendRequests } from "../controllers/friend.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = Router();
/**
 * @swagger
 * /api/user/friends/get-friend-requests:
 *   get:
 *     summary: Lấy danh sách yêu cầu kết bạn
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu kết bạn
 */
router.get('/get-friend-requests', authenticateToken, getFriendRequests);

/**
 * @swagger
 * /api/user/friends/send-friend-request/:recipientId:
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
router.post('/send-friend-request/:recipientId', authenticateToken, sendFriendRequest);

/**
 * @swagger
 * /api/user/friends/response-friend-request/:requestId:
 *   post:
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
 *      - in: body
 *        name: status
 *        required: true
 *        schema:
 *          type: string
 *          enum: [accept, reject]
 *     responses:
 *       200:
 *         description: Yêu cầu kết bạn đã được phản hồi
 */
router.post('/response-friend-request/:requestId', authenticateToken, responseFriendRequest);

export default router;