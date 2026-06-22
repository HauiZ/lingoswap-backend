import express from 'express';
import {
  getDashboard,
  getAllUsers,
  banUser,
  deleteUser,
  getReports,
  resolveReport,
  getAppeals,
  resolveAppeal,
  addBlacklistKeyword,
  getBlacklistKeywords,
  deleteBlacklistKeyword
} from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Chỉ cho phép admin truy cập các API này
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', banUser);
router.delete('/users/:id', deleteUser);
router.get('/reports', getReports);
router.patch('/reports/:id/status', resolveReport);
router.get('/appeals', getAppeals);
router.patch('/appeals/:id/status', resolveAppeal);
router.post('/blacklist-keywords', addBlacklistKeyword);
router.get('/blacklist-keywords', getBlacklistKeywords);
router.delete('/blacklist-keywords/:id', deleteBlacklistKeyword);

export default router;
