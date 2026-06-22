import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';
import internalRoutes from './routes/internal.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import connectDB from './config/database.js';
import eventBus from './config/eventBus.js';
import { registerEventHandlers } from './events/handlers.js';
import { startUnbanWorker } from './workers/unbanWorker.js';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check (dùng cho Render và Docker healthcheck)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-service' });
});

// Internal routes (không có tiền tố /api/users, được mount trực tiếp ở root level)
app.use('/internal', internalRoutes);

// Public API routes
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Error handler
app.use(errorHandler);

// Kết nối database
connectDB();

// Lắng nghe events qua EventBus
registerEventHandlers(eventBus);
eventBus.listen();

// Khởi chạy unban worker
startUnbanWorker();

export default app;
