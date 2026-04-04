import app from './src/app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handleMatchProvider } from './src/sockets/matchHandler.js';
import { socketAuth } from './src/sockets/index.js';
import env from './src/config/env.js';
import redis from './src/config/redis.js';
import { handleChatProvider } from './src/sockets/chatHandler.js';

const PORT = env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// io.use(socketAuth); // Mở ra khi bạn đã có JWT logic

io.on('connection', (socket) => {

  // const userId = socket.user._id.toString();
  // redis.set(`socket:${userId}`, socket.id, 'EX', 86400);
  console.log(`Thiết bị mới kết nối: ${socket.id}`);

  handleMatchProvider(io, socket);
  handleChatProvider(io, socket);

  socket.on('disconnect', () => {
    // redis.del(`socket:${userId}`);
    console.log(`Thiết bị ngắt kết nối: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(` Server đang chạy tại http://localhost:${PORT}`);
  console.log(` Swagger: http://localhost:${PORT}/api-docs`);
});