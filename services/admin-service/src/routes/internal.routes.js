import express from 'express';
import { checkBlacklistKeyword } from '../controllers/internal.controller.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

router.post('/admin/blacklist/check', checkBlacklistKeyword);

export default router;
