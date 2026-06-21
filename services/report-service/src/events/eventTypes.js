// Event type constants cho toàn bộ hệ thống LingoSwap Microservices
// Tất cả services phải dùng constants này thay vì string literal

export const EventTypes = {
  // ─── User Events ───
  USER_CREATED: 'user.created',       // Auth Service → User Service
  USER_UPDATED: 'user.updated',       // User Service → others (nếu cần)
  USER_BANNED: 'user.banned',         // Admin Service → Presence, Notification
  USER_UNBANNED: 'user.unbanned',     // Admin Service → Notification

  // ─── Match Events ───
  MATCH_CREATED: 'match.created',     // Match Service → Chat Service (tạo conversation)
  MATCH_ENDED: 'match.ended',         // Match Service → User Service (cập nhật stats)

  // ─── Friend Events ───
  FRIEND_REQUEST_SENT: 'friend.request.sent',         // Friend → Notification
  FRIEND_REQUEST_ACCEPTED: 'friend.request.accepted', // Friend → Chat (isPermanent), Notification
  FRIEND_REQUEST_REJECTED: 'friend.request.rejected', // Friend → Notification
  FRIEND_REMOVED: 'friend.removed',                   // Friend → Chat (isPermanent=false), Notification

  // ─── Chat Events ───
  MESSAGE_SENT: 'chat.message.sent',            // Chat → Notification (nếu offline)
  CONVERSATION_CREATED: 'chat.conversation.created', // Chat → others

  // ─── Presence Events ───
  USER_ONLINE: 'presence.user.online',    // Presence → Friend Service (broadcast)
  USER_OFFLINE: 'presence.user.offline',  // Presence → Friend Service (broadcast)

  // ─── Notification Events ───
  NOTIFICATION_PUSH: 'notification.push', // Any service → Notification Service

  // ─── Report Events ───
  REPORT_CREATED: 'report.created',   // Report → Notification (notify admins)
  REPORT_RESOLVED: 'report.resolved', // Admin → Notification (notify user)

  // ─── Socket Gateway Events (internal) ───
  SOCKET_CONNECTED: 'socket.connected',       // Gateway → Presence
  SOCKET_DISCONNECTED: 'socket.disconnected', // Gateway → Presence
  SOCKET_EMIT: 'socket.emit',                 // Any service → Gateway (push to client)
};
