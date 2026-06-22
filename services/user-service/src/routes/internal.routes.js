import express from 'express';
import {
  getUserByIdInternal,
  getUserBasicInfo,
  getUsersByIds,
  updateUserStatus,
  updateUserStats,
  banUserInternal,
  unbanUserInternal,
  deleteUserInternal,
  getUsersStats,
  getUsersInternal,
  createUserReviewInternal,
  getUserReviewsBySessionsInternal,
  getUserReviewsBySessionInternal,
  checkUserReviewInternal,
  getAllAppealsInternal,
  resolveAppealInternal
} from '../controllers/internal.controller.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

router.get('/users', getUsersInternal);
router.get('/users/stats', getUsersStats);
router.get('/users/:id', getUserByIdInternal);
router.get('/users/:id/basic', getUserBasicInfo);
router.post('/users/bulk', getUsersByIds);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/stats', updateUserStats);
router.patch('/users/:id/ban', banUserInternal);
router.patch('/users/:id/unban', unbanUserInternal);
router.delete('/users/:id', deleteUserInternal);

router.post('/users/reviews', createUserReviewInternal);
router.post('/users/reviews/bulk', getUserReviewsBySessionsInternal);
router.get('/users/reviews/session/:sessionId', getUserReviewsBySessionInternal);
router.get('/users/reviews/check', checkUserReviewInternal);

router.get('/users/appeals', getAllAppealsInternal);
router.patch('/users/appeals/:id/resolve', resolveAppealInternal);

export default router;
