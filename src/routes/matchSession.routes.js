import { Router } from "express";
import { getMatchHistory, getMatchSessionDetails } from "../controllers/matchSession.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

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

export default router;
