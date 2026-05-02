import { Router } from "express";
import { createReport } from "./report.controller.js";
import { authenticateToken } from '../../core/middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * /api/user/reports:
 *   post:
 *     summary: User gửi báo cáo vi phạm người dùng khác
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportedUserId:
 *                 type: string
 *               reason:
 *                 type: string
 *               matchSessionId:
 *                 type: string
 *               conversationId:
 *                 type: string
 *               evidenceMessageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Báo cáo đã được ghi lại thành công
 */
router.post('/', authenticateToken, createReport);

export default router;
