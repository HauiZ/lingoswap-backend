import express from 'express';
import cors from 'cors';
import gatewayRoutes from './routes/gateway.routes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

// Health check (dùng cho Docker healthcheck & Render)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// Chuyển tiếp các REST endpoints sang các service tương ứng
app.use('/', gatewayRoutes);

// Error handler
app.use(errorHandler);

export default app;
