import express from 'express';
import {
  pushNotificationInternal,
  pushNotificationToAdminsInternal,
  updateNotificationContentInternal
} from '../controllers/internal.controller.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

router.post('/notifications/push', pushNotificationInternal);
router.post('/notifications/push/admins', pushNotificationToAdminsInternal);
router.patch('/notifications/update', updateNotificationContentInternal);

export default router;
