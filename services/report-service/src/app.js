import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import reportRoutes from './routes/report.routes.js';
import internalRoutes from './routes/internal.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import connectDB from './config/database.js';
import eventBus from './config/eventBus.js';
import { registerEventHandlers } from './events/handlers.js';

const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'report-service' });
});

// Internal routes
app.use('/internal', internalRoutes);

// Public API routes
app.use('/api/user/reports', reportRoutes);

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

export default app;
