import express from 'express';
import {
  getUserByIdInternal,
  getUserBasicInfo,
  getUsersByIds,
  updateUserStatus,
  updateUserStats,
  banUserInternal,
  getUsersStats
} from '../controllers/internal.controller.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

router.get('/users/stats', getUsersStats);
router.get('/users/:id', getUserByIdInternal);
router.get('/users/:id/basic', getUserBasicInfo);
router.post('/users/bulk', getUsersByIds);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/stats', updateUserStats);
router.patch('/users/:id/ban', banUserInternal);

export default router;
