// import Redis from 'ioredis';
// import env from './env.js';

// // Khởi tạo connection (Mặc định localhost:6379)
// const redis = new Redis(env.REDIS_URI || 'redis://127.0.0.1:6379');

// redis.on('connect', () => console.log('✅ Đã kết nối Redis thành công'));
// redis.on('error', (err) => console.error('❌ Lỗi kết nối Redis:', err));

// export default redis;

import Redis from 'ioredis';
import env from './env.js';

const redisUrl = env.REDIS_URI || 'redis://127.0.0.1:6379';

// Cấu hình nâng cao cho ioredis
const redisOptions = {
    // Tự động gửi tín hiệu ping sau mỗi 5 giây (5000ms) để giữ kết nối với Upstash không bị ngắt
    redisOptions: {
        keepAlive: 5000,
    }
};

// Nếu kết nối qua Upstash, bật thêm cấu hình TLS/SSL bảo mật
if (redisUrl.includes('upstash.io')) {
    redisOptions.tls = { rejectUnauthorized: false };
}

// Khởi tạo kết nối với các tùy chọn trên
const redis = new Redis(redisUrl, redisOptions);

redis.on('connect', () => console.log('✅ Đã kết nối Redis thành công'));
redis.on('error', (err) => {
    // Ẩn bớt log ECONNRESET phiền phức nếu bạn không muốn nhìn thấy nó
    if (err.message.includes('ECONNRESET')) return;
    console.error('❌ Lỗi kết nối Redis:', err);
});

export default redis;