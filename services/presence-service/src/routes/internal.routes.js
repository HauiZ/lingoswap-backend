import express from 'express';
import presenceService from '../services/presence.service.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

// 1. Lấy trạng thái online của 1 user
router.get('/presence/:userId/status', (req, res) => {
    const { userId } = req.params;
    const isOnline = presenceService.isOnline(userId);
    res.json({ isOnline });
});

// 2. Lấy trạng thái online của nhiều users (bulk query)
router.post('/presence/status/bulk', (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'userIds must be an array' });
    }

    const statusMap = {};
    userIds.forEach(userId => {
        statusMap[userId] = presenceService.isOnline(userId);
    });

    res.json(statusMap);
});

// 3. Lấy tổng số lượng user đang online
router.get('/presence/online/count', (req, res) => {
    const count = presenceService.getOnlineCount();
    res.json({ count });
});

// 4. Lấy danh sách ID bạn bè đang online
router.get('/presence/:userId/friends/online', async (req, res) => {
    const { userId } = req.params;
    const friendIds = await presenceService.getOnlineFriendIds(userId);
    res.json({ friendIds });
});

// 5. Khóa (force disconnect) socket của user khi bị ban
router.post('/presence/:userId/force-disconnect', async (req, res) => {
    const { userId } = req.params;
    await presenceService.forceDisconnect(userId);
    res.json({ success: true, message: `Force disconnected user: ${userId}` });
});

export default router;
