import express from 'express';
import cors from 'cors';
import internalRoutes from './routes/internal.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import eventBus from './config/eventBus.js';
import { registerEventHandlers } from './events/handlers.js';
import presenceService from './services/presence.service.js';

const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (được dùng bởi Render và Docker)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'presence-service' });
});

// Mount internal routing
app.use('/internal', internalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Error handler
app.use(errorHandler);

// Lắng nghe events qua EventBus
registerEventHandlers(eventBus);
eventBus.listen();

// Khởi chạy timeout checker cho user offline
presenceService.startTimeoutChecker();

export default app;
