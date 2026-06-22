import { Router } from "express";
import { getMatchHistory, getMatchSessionDetails, createReview } from '../controllers/matchSession.controller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getMatchHistory);
router.get('/:sessionId', authenticateToken, getMatchSessionDetails);
router.post('/:sessionId/reviews', authenticateToken, createReview);

export default router;
