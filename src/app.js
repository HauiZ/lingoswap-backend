import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './core/config/swagger.js';
import connectDB from './core/config/database.js';
import userRoutes from './modules/users/user.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import conversationRoutes from './modules/chat/conversation.routes.js';
import friendRoutes from './modules/friends/friend.routes.js';
import matchSessionRoutes from './modules/match/matchSession.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import errorHandler from './core/middlewares/errorHandler.js';
import env from './core/config/env.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const appFile = fileURLToPath(import.meta.url);
const appDir = dirname(appFile);


const app = express();

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    const methodColor = req.method === 'POST' ? '\x1b[32m' : // Green
                        req.method === 'GET' ? '\x1b[36m' :  // Cyan
                        req.method === 'PATCH' ? '\x1b[33m' : // Yellow
                        req.method === 'DELETE' ? '\x1b[31m' : // Red
                        '\x1b[0m'; // Reset
    console.log(`\x1b[1m🚀 [API CALL]\x1b[0m ${methodColor}${req.method}\x1b[0m \x1b[4m${req.originalUrl}\x1b[0m`);
  }
  next();
});

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(appDir, '../public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(appDir, '../views'));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user/conversations', conversationRoutes);
app.use('/api/user/friends', friendRoutes);
app.use('/api/user/matches', matchSessionRoutes);
app.use('/api/user/reports', reportRoutes);
app.use('/api/user/notifications', notificationRoutes);

// Home route

app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến LingoSwap API!',
    documentation: 'Xem tài liệu API tại http://localhost:5000/api-docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Error handler
app.use(errorHandler);
connectDB();
export default app;

