export const serviceRegistry = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:5001',
  user:         process.env.USER_SERVICE_URL         || 'http://localhost:5002',
  chat:         process.env.CHAT_SERVICE_URL         || 'http://localhost:5003',
  match:        process.env.MATCH_SERVICE_URL        || 'http://localhost:5004',
  friend:       process.env.FRIEND_SERVICE_URL       || 'http://localhost:5005',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006',
  presence:     process.env.PRESENCE_SERVICE_URL     || 'http://localhost:5007',
  report:       process.env.REPORT_SERVICE_URL       || 'http://localhost:5008',
  admin:        process.env.ADMIN_SERVICE_URL        || 'http://localhost:5009',
};

export default serviceRegistry;
