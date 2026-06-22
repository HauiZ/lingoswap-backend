import express from 'express';
import {
  getDirectConversations,
  setConversationPermanent,
  getRecentInteractedConversations,
  getConversationsByMatchSessions,
  getConversationByMatchSession,
  getMessagesInternal,
  getMessagesStats
} from '../controllers/internal.controller.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

router.get('/internal/conversations/direct/:userId', getDirectConversations);
router.patch('/internal/conversations/permanent', setConversationPermanent);
router.get('/internal/conversations/recent-interacted/:userId', getRecentInteractedConversations);
router.post('/internal/conversations/by-match-sessions', getConversationsByMatchSessions);
router.get('/internal/conversations/by-match-session/:sessionId', getConversationByMatchSession);
router.get('/internal/conversations/:conversationId/messages', getMessagesInternal);
router.get('/internal/messages/stats', getMessagesStats);

export default router;
