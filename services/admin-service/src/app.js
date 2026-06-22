import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import adminRoutes from './routes/admin.routes.js';
import internalRoutes from './routes/internal.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import connectDB from './config/database.js';

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
  res.status(200).json({ status: 'ok', service: 'admin-service' });
});

// Internal routes
app.use('/internal', internalRoutes);

// Public admin routes
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Error handler
app.use(errorHandler);

// Kết nối database
connectDB();

export default app;
