import { Router } from "express";
import { getMatchHistory, getMatchSessionDetails, createReview } from "./matchSession.controller.js";
import { authenticateToken } from '../../core/middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/user/matches:
 *   get:
 *     summary: Lấy danh sách lịch sử các phiên Matching
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch sử gọi/matching
 */
router.get('/', authenticateToken, getMatchHistory);

/**
 * @swagger
 * /api/user/matches/{sessionId}:
 *   get:
 *     summary: Lấy chi tiết phiên gọi bao gồm tin nhắn
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin chi tiết kèm lịch sử chat
 */
router.get('/:sessionId', authenticateToken, getMatchSessionDetails);

/**
 * @swagger
 * /api/user/matches/{sessionId}/review:
 *   post:
 *     summary: Đánh giá một phiên gọi và người dùng đối tác
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Số sao (1-5)
 *               comment:
 *                 type: string
 *                 description: Bình luận đánh giá
 *     responses:
 *       201:
 *         description: Đánh giá thành công
 *       400:
 *         description: Đã đánh giá rồi hoặc dữ liệu không hợp lệ
 */
router.post('/:sessionId/review', authenticateToken, createReview);

export default router;
