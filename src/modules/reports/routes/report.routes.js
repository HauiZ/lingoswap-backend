import { Router } from "express";
import { createReport } from '../controllers/report.controller.js';
import { authenticateToken } from '../../../core/middlewares/auth.js';
import { uploadEvidenceImage } from '../../../core/middlewares/upload.js';

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
 *         multipart/form-data:
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
 *               evidenceImage:
 *                 type: string
 *                 format: binary
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
 *               evidenceImageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Báo cáo đã được ghi lại thành công
 */
router.post('/', authenticateToken, uploadEvidenceImage.single('evidenceImage'), createReport);

export default router;
