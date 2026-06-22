import axios from 'axios';

/**
 * Registry URL cho từng service.
 * Đọc từ environment variables, fallback về localhost cho dev.
 */
const getServiceUrls = () => ({
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:5001',
  user:         process.env.USER_SERVICE_URL         || 'http://localhost:5002',
  chat:         process.env.CHAT_SERVICE_URL         || 'http://localhost:5003',
  match:        process.env.MATCH_SERVICE_URL        || 'http://localhost:5004',
  friend:       process.env.FRIEND_SERVICE_URL       || 'http://localhost:5005',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006',
  presence:     process.env.PRESENCE_SERVICE_URL     || 'http://localhost:5007',
  report:       process.env.REPORT_SERVICE_URL       || 'http://localhost:5008',
  admin:        process.env.ADMIN_SERVICE_URL        || 'http://localhost:5009',
});

/**
 * Tạo một axios instance được cấu hình sẵn để gọi service khác.
 *
 * @param {string} serviceName - Tên service (ví dụ: 'user', 'chat', 'match')
 * @returns {import('axios').AxiosInstance}
 *
 * Ví dụ sử dụng:
 *   const userClient = createServiceClient('user');
 *   const { data } = await userClient.get('/internal/users/123');
 */
export const createServiceClient = (serviceName) => {
  const urls = getServiceUrls();
  const baseURL = urls[serviceName];

  if (!baseURL) {
    throw new Error(`[ServiceClient] Unknown service: "${serviceName}"`);
  }

  const client = axios.create({
    baseURL,
    timeout: 8000, // 8s timeout cho inter-service calls
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Service': 'true', // Header để phân biệt internal calls
    },
  });

  // Request interceptor: log request
  client.interceptors.request.use((config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ServiceClient] ${serviceName.toUpperCase()} → ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  });

  // Response interceptor: normalize error
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      const url = error.config?.url;

      console.error(`[ServiceClient] ${serviceName.toUpperCase()} call failed: ${status} ${url} — ${message}`);

      // Tạo error có thông tin đầy đủ hơn
      const serviceError = new Error(`[${serviceName}] ${message}`);
      serviceError.status = status;
      serviceError.originalError = error;
      throw serviceError;
    }
  );

  return client;
};
