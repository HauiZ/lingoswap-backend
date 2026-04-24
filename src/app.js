import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import connectDB from './config/database.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import friendRoutes from './routes/friend.routes.js';
import matchSessionRoutes from './routes/matchSession.routes.js';
import reportRoutes from './routes/report.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import env from './config/env.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();

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
app.use(express.static(path.join(__dirname, '../public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

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

