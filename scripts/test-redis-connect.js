import Redis from 'ioredis';

async function test() {
  try {
    console.log('Connecting to Redis at redis://localhost:6379 ...');
    const redis = new Redis('redis://localhost:6379', { maxRetriesPerRequest: 1 });
    await redis.ping();
    console.log('✅ Redis connected successfully!');
    await redis.quit();
    process.exit(0);
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    process.exit(1);
  }
}

test();
