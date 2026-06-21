import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import env from './src/config/env.js';

const PORT = env.PORT || 5006;
const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`🚀 [Notification Service] Running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Notification Service] SIGTERM received — shutting down gracefully');
  httpServer.close(() => {
    console.log('[Notification Service] HTTP server closed');
    process.exit(0);
  });
});
