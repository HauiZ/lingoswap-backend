import express from 'express';
import {
  getReportsInternal,
  resolveReportInternal,
  getReportsStatsInternal
} from '../controllers/internal.controller.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

router.get('/reports', getReportsInternal);
router.get('/reports/stats', getReportsStatsInternal);
router.patch('/reports/:id/resolve', resolveReportInternal);

export default router;
