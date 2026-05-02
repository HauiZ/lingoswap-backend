import express from 'express';
import { getMessagesByConversation, getAllConversation, sendImageMessage } from './conversation.controller.js';
import { authenticateToken } from '../../core/middlewares/auth.js';
import { uploadChatImage } from '../../core/middlewares/upload.js';

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

/**
 * @swagger
 * /api/user/conversations/upload-image:
 *   post:
 *     summary: Upload ảnh chat lên Cloudinary, trả về URL để gửi qua socket
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Trả về URL của ảnh đã upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   example: "https://res.cloudinary.com/..."
 */
router.post(
    '/upload-image',
    authenticateToken,
    uploadChatImage.single('image'),
    sendImageMessage
);

export default router;
