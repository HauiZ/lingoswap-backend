import Redis from 'ioredis';
import { env } from './env.js';

// Khởi tạo connection (Mặc định localhost:6379)
const redis = new Redis(env.REDIS_URI || 'redis://127.0.0.1:6379');

redis.on('connect', () => console.log('✅ Đã kết nối Redis thành công'));
redis.on('error', (err) => console.error('❌ Lỗi kết nối Redis:', err));

export default redis;