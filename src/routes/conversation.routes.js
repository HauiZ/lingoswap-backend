import express from 'express';
import { getMessagesByConversation, getAllConversation } from '../controllers/conversation.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/user/conversations/all:
 *   get:
 *     summary: Lấy tất cả các cuộc trò chuyện
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả các cuộc trò chuyện
 */
router.get('/all', authenticateToken, getAllConversation);

/**
 * @swagger
 * /api/user/conversations/{conversationId}:
 *   get:
 *     summary: Lấy tin nhắn trong một cuộc trò chuyện
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách tin nhắn
 */
router.get('/:conversationId', authenticateToken, getMessagesByConversation);

export default router;