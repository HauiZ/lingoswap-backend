import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import serviceRegistry from '../config/serviceRegistry.js';

const router = express.Router();

const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  onError: (err, req, res) => {
    console.error(`Proxy error to ${target}:`, err.message);
    res.status(502).json({ error: 'Dịch vụ tạm thời không khả dụng' });
  }
});

// 1. Auth Service Routes
router.use('/api/auth', createProxyMiddleware(proxyOptions(serviceRegistry.auth)));

// 2. User Service Routes
router.use('/api/users', createProxyMiddleware(proxyOptions(serviceRegistry.user)));

// 3. Chat Service Routes
router.use('/api/user/conversations', createProxyMiddleware(proxyOptions(serviceRegistry.chat)));

// 4. Match Service Routes
router.use('/api/user/matches', createProxyMiddleware(proxyOptions(serviceRegistry.match)));

// 5. Friend Service Routes
router.use('/api/user/friends', createProxyMiddleware(proxyOptions(serviceRegistry.friend)));

// 6. Notification Service Routes
router.use('/api/user/notifications', createProxyMiddleware(proxyOptions(serviceRegistry.notification)));

// 7. Report Service Routes
router.use('/api/user/reports', createProxyMiddleware(proxyOptions(serviceRegistry.report)));

// 8. Admin Service Routes
router.use('/api/admin', createProxyMiddleware(proxyOptions(serviceRegistry.admin)));

export default router;
