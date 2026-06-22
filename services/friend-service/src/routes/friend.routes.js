import { Router } from "express";
import { getListFriends, sendFriendRequest, responseFriendRequest, getFriendRequests, removeFriend, checkFriendStatus, getOnlineFriends } from '../controllers/friend.controller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getListFriends);
router.get('/requests', authenticateToken, getFriendRequests);
router.post('/:recipientId/requests', authenticateToken, sendFriendRequest);
router.patch('/requests/:requestId', authenticateToken, responseFriendRequest);
router.delete('/:friendId', authenticateToken, removeFriend);
router.get('/:targetUserId/status', authenticateToken, checkFriendStatus);
router.get('/online', authenticateToken, getOnlineFriends);

export default router;
