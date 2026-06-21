import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import env from './src/config/env.js';

const PORT = env.PORT || 5007;
const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`🚀 [Presence Service] Running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Presence Service] SIGTERM received — shutting down gracefully');
  httpServer.close(() => {
    console.log('[Presence Service] HTTP server closed');
    process.exit(0);
  });
});
