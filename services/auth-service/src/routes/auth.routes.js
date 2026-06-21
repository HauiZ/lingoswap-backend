import express from 'express';
import {
  register, login, googleLogin, facebookLogin,
  logout, refreshAccessToken, changePassword,
  forgotPassword, resetPassword,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register',        register);
router.post('/login',           login);
router.post('/google',          googleLogin);
router.post('/facebook',        facebookLogin);
router.post('/logout',          logout);
router.post('/refresh-token',   refreshAccessToken);
router.post('/password/forgot', forgotPassword);
router.post('/password/reset',  resetPassword);

// Protected routes
router.patch('/password', authenticateToken, changePassword);

export default router;
