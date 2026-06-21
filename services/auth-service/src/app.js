import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import connectDB from './config/database.js';

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
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Error handler
app.use(errorHandler);

connectDB();

export default app;
