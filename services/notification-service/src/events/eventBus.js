import Redis from 'ioredis';

/**
 * EventBus: Redis Pub/Sub wrapper cho giao tiếp bất đồng bộ giữa các microservices.
 *
 * Cách dùng:
 *   const bus = new EventBus(process.env.REDIS_URI);
 *   bus.subscribe('user.created', async (payload) => { ... });
 *   bus.listen();
 *   await bus.publish('user.created', { userId: '...' });
 */
class EventBus {
  constructor(redisUri) {
    if (!redisUri) {
      throw new Error('[EventBus] REDIS_URI is required');
    }

    this.publisher = new Redis(redisUri, {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.subscriber = new Redis(redisUri, {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.handlers = new Map(); // eventType → [handler functions]
    this.CHANNEL = 'lingoswap:events';
    this.isListening = false;

    // Log connection events
    this.publisher.on('connect', () => console.log('[EventBus] Publisher connected to Redis'));
    this.publisher.on('error', (err) => console.error('[EventBus] Publisher error:', err.message));
    this.subscriber.on('connect', () => console.log('[EventBus] Subscriber connected to Redis'));
    this.subscriber.on('error', (err) => console.error('[EventBus] Subscriber error:', err.message));
  }

  /**
   * Publish một event lên Redis channel.
   * @param {string} eventType - Loại event (dùng EventTypes constants)
   * @param {object} payload   - Dữ liệu đính kèm
   */
  async publish(eventType, payload) {
    const message = JSON.stringify({
      type: eventType,
      payload,
      timestamp: Date.now(),
      id: `${eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    });

    try {
      await this.publisher.publish(this.CHANNEL, message);
    } catch (err) {
      console.error(`[EventBus] Failed to publish event "${eventType}":`, err.message);
      throw err;
    }
  }

  /**
   * Đăng ký handler cho một loại event.
   * @param {string}   eventType - Loại event cần lắng nghe
   * @param {Function} handler   - async function(payload) xử lý event
   */
  subscribe(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
  }

  /**
   * Bắt đầu lắng nghe events từ Redis channel.
   * Gọi sau khi đã đăng ký tất cả handlers.
   */
  listen() {
    if (this.isListening) return;

    this.subscriber.subscribe(this.CHANNEL, (err) => {
      if (err) {
        console.error('[EventBus] Failed to subscribe to channel:', err.message);
        return;
      }
      console.log(`[EventBus] Listening on channel: ${this.CHANNEL}`);
    });

    this.subscriber.on('message', async (channel, rawMessage) => {
      if (channel !== this.CHANNEL) return;

      let eventType, payload;
      try {
        const parsed = JSON.parse(rawMessage);
        eventType = parsed.type;
        payload = parsed.payload;
      } catch (err) {
        console.error('[EventBus] Failed to parse message:', rawMessage);
        return;
      }

      const handlers = this.handlers.get(eventType) || [];
      if (handlers.length === 0) return; // Không có handler cho event này ở service này

      for (const handler of handlers) {
        try {
          await handler(payload);
        } catch (err) {
          console.error(`[EventBus] Handler error for event "${eventType}":`, err.message);
        }
      }
    });

    this.isListening = true;
  }

  /**
   * Đóng kết nối Redis (dùng khi shutdown gracefully).
   */
  async close() {
    await this.publisher.quit();
    await this.subscriber.quit();
    this.isListening = false;
    console.log('[EventBus] Connections closed');
  }
}

export default EventBus;
