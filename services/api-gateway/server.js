import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import env from './src/config/env.js';
import { initSocketGateway } from './src/socket/socketGateway.js';
import eventBus from './src/config/eventBus.js';

const PORT = env.PORT || 5000;
const httpServer = createServer(app);

// Khởi tạo Socket.io Gateway
initSocketGateway(httpServer);

// Khởi chạy EventBus lắng nghe các socket events nội bộ
eventBus.listen();

httpServer.listen(PORT, () => {
  console.log(`🚀 [API Gateway] Running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[API Gateway] SIGTERM received — shutting down gracefully');
  httpServer.close(async () => {
    console.log('[API Gateway] HTTP server closed');
    await eventBus.close();
    process.exit(0);
  });
});
