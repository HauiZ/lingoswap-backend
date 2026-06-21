import express from 'express';
import { getMyProfile, getUserById, updateMyProfile, uploadAvatar, getDashboard, searchUsers, searchFriends, submitAppeal } from '../controllers/user.controller.js';
import { authenticateToken, verifyAppealToken } from '../middlewares/authMiddleware.js';
import { uploadImage } from '../middlewares/upload.js';

const router = express.Router();

// Routes cho user cá nhân
router.get('/me', authenticateToken, getMyProfile);
router.put('/me', authenticateToken, updateMyProfile);
router.put('/me/avatar', authenticateToken, uploadImage.single('avatar'), uploadAvatar);
router.get('/dashboard', authenticateToken, getDashboard);

// Route kháng cáo
router.post('/appeals', verifyAppealToken, submitAppeal);

// Route tìm kiếm
router.get('/', authenticateToken, searchUsers);
router.get('/me/friends', authenticateToken, searchFriends);

// Route xem public profile của người khác
router.get('/:id', getUserById);

export default router;
