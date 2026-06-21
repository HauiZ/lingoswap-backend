import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import redis from '../config/redis.js';
import eventBus from '../config/eventBus.js';
import { EventTypes } from '../events/eventTypes.js';

import registerSocketRouter from './socketRouter.js';

const socketMap = new Map(); // userId -> socketId

export const initSocketGateway = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate socket connections using JWT
  io.use(async (socket, next) => {
    try {
      // Đọc token từ handshake auth hoặc query
      const authHeader = socket.handshake.auth?.token || socket.handshake.query?.token;
      const token = authHeader && authHeader.split(' ')[1] || authHeader;

      if (!token) {
        return next(new Error('Authentication error: Token not found'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      
      // Kiểm tra xem tài khoản có bị khóa trong Redis không
      // decoded.id chính là userId
      const userId = decoded.id;
      const isBanned = await redis.get(`blacklist:banned:${userId}`);
      if (isBanned) {
        return next(new Error('Authentication error: Account is banned'));
      }

      socket.user = decoded;
      next();
    } catch (err) {
      console.error('[Socket Auth] Authentication failed:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id.toString();
    console.log(`🔌 [Socket Gateway] Client connected: ${userId} (socket ID: ${socket.id})`);
    
    socketMap.set(userId, socket.id);

    // Báo cho Presence Service biết user online
    eventBus.publish(EventTypes.SOCKET_CONNECTED, { userId, socketId: socket.id });

    // Đăng ký toàn bộ sự kiện chat/match/heartbeat qua Router
    registerSocketRouter(socket);

    // 4. WebRTC Signaling và Call room (Xử lý trực tiếp tại API Gateway để tối ưu hiệu năng)
    socket.on('join_call_room', ({ sessionId }) => {
      socket.join(sessionId);
      console.log(`🔌 [Socket Gateway] User ${userId} joined room ${sessionId}`);
    });

    socket.on('webrtc_offer', ({ sessionId, offer }) => {
      socket.to(sessionId).emit('webrtc_offer', { offer });
    });

    socket.on('webrtc_answer', ({ sessionId, answer }) => {
      socket.to(sessionId).emit('webrtc_answer', { answer });
    });

    socket.on('webrtc_ice_candidate', ({ sessionId, candidate }) => {
      socket.to(sessionId).emit('webrtc_ice_candidate', { candidate });
    });

    // 5. Ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`🔌 [Socket Gateway] Client disconnected: ${userId} (socket ID: ${socket.id})`);
      socketMap.delete(userId);
      eventBus.publish(EventTypes.SOCKET_DISCONNECTED, { userId, socketId: socket.id });
    });
  });

  // --- Lắng nghe events từ các Microservices để phát lại tới client ---

  // Service muốn gửi socket emit tới client
  eventBus.subscribe(EventTypes.SOCKET_EMIT, async (payload) => {
    const { targetUserId, event, data } = payload;
    if (!targetUserId) return;

    if (Array.isArray(targetUserId)) {
      targetUserId.forEach((id) => {
        const socketId = socketMap.get(id.toString());
        if (socketId) {
          io.to(socketId).emit(event, data);
        }
      });
    } else {
      const socketId = socketMap.get(targetUserId.toString());
      if (socketId) {
        io.to(socketId).emit(event, data);
      }
    }
  });

  // Bắt buộc ngắt kết nối user (ví dụ: bị ban)
  eventBus.subscribe('socket.force_disconnect', async (payload) => {
    const { userId } = payload;
    if (!userId) return;

    const socketId = socketMap.get(userId.toString());
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        console.log(`🔌 [Socket Gateway] Force disconnecting banned user: ${userId}`);
        socket.disconnect(true);
      }
      socketMap.delete(userId.toString());
    }
  });

  // Thêm user vào room (dùng khi match found cần chuyển phòng)
  eventBus.subscribe('socket.join_room', async (payload) => {
    const { userId, roomId } = payload;
    if (!userId || !roomId) return;

    const socketId = socketMap.get(userId.toString());
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(roomId);
        console.log(`🔌 [Socket Gateway] User ${userId} joined room ${roomId} via Event`);
      }
    }
  });

  // Rời phòng
  eventBus.subscribe('socket.leave_room', async (payload) => {
    const { userId, roomId } = payload;
    if (!userId || !roomId) return;

    const socketId = socketMap.get(userId.toString());
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(roomId);
        console.log(`🔌 [Socket Gateway] User ${userId} left room ${roomId} via Event`);
      }
    }
  });

  // Phát tín hiệu tới toàn bộ thành viên trong phòng (Room broadcast)
  eventBus.subscribe('socket.room_broadcast', async (payload) => {
    const { roomId, event, data, excludeUserId } = payload;
    if (!roomId || !event) return;

    if (excludeUserId) {
      const excludeSocketId = socketMap.get(excludeUserId.toString());
      if (excludeSocketId) {
        const socket = io.sockets.sockets.get(excludeSocketId);
        if (socket) {
          socket.to(roomId).emit(event, data);
          return;
        }
      }
    }
    io.to(roomId).emit(event, data);
  });

  console.log('✅ [Socket Gateway] Initialized and listening for connections');
  return io;
};
