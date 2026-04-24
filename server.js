import app from './src/app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handleMatchProvider } from './src/sockets/matchHandler.js';
import { socketAuth } from './src/sockets/index.js';
import env from './src/config/env.js';
import redis from './src/config/redis.js';
import { handleChatProvider } from './src/sockets/chatHandler.js';
import { startLastOnlineWorker } from './src/workers/syncLastOnline.js';
import { startUnbanWorker } from './src/workers/unbanWorker.js';
import User from './src/models/User.js';

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
app.set('io', io); // Cho phép controller HTTP truy cập socket instance

io.on('connection', async (socket) => {

  const userId = socket.user._id.toString();
  redis.set(`socket:${userId}`, socket.id, 'EX', 86400);
  await User.findByIdAndUpdate(userId, { status: 'online' });
  console.log(`Thiết bị mới kết nối: ${socket.id}`);

  handleMatchProvider(io, socket);
  handleChatProvider(io, socket);

  socket.on('disconnect', async () => {
    redis.del(`socket:${userId}`);
    await redis.sadd('sync:lastOnline:users', userId);
    console.log(`Thiết bị ngắt kết nối: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(` Server đang chạy tại http://localhost:${PORT}`);
  console.log(` Swagger: http://localhost:${PORT}/api-docs`);
  startLastOnlineWorker();
  startUnbanWorker();
});