import app from './src/app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handleMatchProvider } from './src/sockets/matchHandler.js';
import { handleChatProvider } from './src/sockets/chatHandler.js';
import { handlePresenceProvider } from './src/sockets/presenceHandler.js';
import { socketAuth } from './src/sockets/index.js';
import env from './src/config/env.js';
import presenceService from './src/services/presence.service.js';
import { startLastOnlineWorker } from './src/workers/syncLastOnline.js';
import { startUnbanWorker } from './src/workers/unbanWorker.js';

const PORT = env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }
});

io.use(socketAuth);
app.set('io', io);

io.on('connection', async (socket) => {
  const userId = socket.user._id.toString();

  await presenceService.setOnline(userId, socket.id, io);

  handleMatchProvider(io, socket);
  handleChatProvider(io, socket);
  handlePresenceProvider(io, socket);

  socket.on('disconnect', async () => {
    await presenceService.setOffline(userId, io);
  });
});

httpServer.listen(PORT, () => {
  console.log(` Server đang chạy tại http://localhost:${PORT}`);
  console.log(` Swagger: http://localhost:${PORT}/api-docs`);
  startLastOnlineWorker();
  startUnbanWorker();
  presenceService.startTimeoutChecker(io);
});