import Redis from 'ioredis';
import env from './env.js';

const redisUrl = env.REDIS_URI || 'redis://127.0.0.1:6379';

const redisOptions = {
  redisOptions: { keepAlive: 5000 },
  retryStrategy: (times) => Math.min(times * 100, 3000),
};

if (redisUrl.includes('upstash.io')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

const redis = new Redis(redisUrl, redisOptions);

redis.on('connect', () => console.log('✅ [Presence Service] Redis connected'));
redis.on('error', (err) => {
  if (err.message.includes('ECONNRESET')) return;
  console.error('❌ [Presence Service] Redis error:', err.message);
});

export default redis;
