import express from 'express';
import {
  getFriendIdsInternal,
  checkFriendshipStatusInternal,
  getFriendsStatsInternal
} from '../controllers/internal.controller.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

router.get('/friends/stats', getFriendsStatsInternal);
router.get('/friends/:userId/ids', getFriendIdsInternal);
router.get('/friends/:userId/check/:targetId', checkFriendshipStatusInternal);

export default router;
