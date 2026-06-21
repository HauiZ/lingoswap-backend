import eventBus from '../config/eventBus.js';

export const registerSocketRouter = (socket) => {
  const userId = socket.user.id.toString();

  // 1. Presence heartbeat
  socket.on('heartbeat', () => {
    eventBus.publish('presence.heartbeat', { userId });
  });

  // 2. Chat messaging
  socket.on('send_message', (data) => {
    eventBus.publish('chat.send_message', { userId, ...data });
  });

  // 3. Match queue & requests
  socket.on('join_queue', (data) => {
    eventBus.publish('match.join_queue', { userId, ...data });
  });

  socket.on('leave_queue', () => {
    eventBus.publish('match.leave_queue', { userId });
  });

  socket.on('direct_match_request', (data) => {
    eventBus.publish('match.direct_request', { userId, ...data });
  });

  socket.on('direct_match_response', (data) => {
    eventBus.publish('match.direct_response', { userId, ...data });
  });
};

export default registerSocketRouter;
