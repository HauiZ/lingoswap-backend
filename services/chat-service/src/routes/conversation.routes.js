import express from 'express';
import { getMessagesByConversation, getAllConversation, sendImageMessage } from '../controllers/conversation.controller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { uploadChatImage } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', authenticateToken, getAllConversation);
router.get('/:conversationId', authenticateToken, getMessagesByConversation);
router.post(
    '/images',
    authenticateToken,
    uploadChatImage.single('image'),
    sendImageMessage
);

export default router;
