import app from './src/app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import matchModule from './src/modules/match/index.js';
import chatModule from './src/modules/chat/index.js';
import presenceModule from './src/modules/presence/index.js';
import { socketAuth } from './src/core/middlewares/socketAuth.js';
import env from './src/core/config/env.js';
import presenceService from './src/modules/presence/services/presence.service.js';
import { startLastOnlineWorker } from './src/modules/presence/workers/syncLastOnline.js';
import { startUnbanWorker } from './src/modules/users/workers/unbanWorker.js';

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
  const isReconnect = presenceService.isReconnecting(userId);

  await presenceService.setOnline(userId, socket.id, io);

  matchModule.initSockets(io, socket);
  chatModule.initSockets(io, socket);
  presenceModule.initSockets(io, socket);

  socket.on('disconnect', async () => {
    presenceService.scheduleOffline(userId, socket.id, io, async () => {
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(` Server đang chạy tại http://localhost:${PORT}`);
  console.log(` Swagger: http://localhost:${PORT}/api-docs`);
  startLastOnlineWorker();
  startUnbanWorker();
  presenceService.startTimeoutChecker(io);
});