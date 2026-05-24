// tests/__mocks__/ioredis.js
import { EventEmitter } from 'events';

// Bộ nhớ RAM giả lập cho Redis
const redisStore = {};
const listStore = {}; // Để giả lập các lệnh LIST như RPUSH, LPOP, LREM, LPOS

class RedisMock extends EventEmitter {
  constructor() {
    super();
    process.nextTick(() => {
      this.emit('connect');
      this.emit('ready');
    });
  }

  options = {};
  status = 'ready';

  async get(key) {
    return redisStore[key] || null;
  }

  async set(key, value, ...args) {
    redisStore[key] = String(value);
    return 'OK';
  }

  async del(key) {
    if (redisStore[key]) {
      delete redisStore[key];
      return 1;
    }
    return 0;
  }

  // Giả lập RPUSH
  async rpush(key, value) {
    if (!listStore[key]) {
      listStore[key] = [];
    }
    listStore[key].push(String(value));
    return listStore[key].length;
  }

  // Giả lập LPOS
  async lpos(key, value) {
    const list = listStore[key] || [];
    const index = list.indexOf(String(value));
    return index !== -1 ? index : null;
  }

  // Giả lập LREM
  async lrem(key, count, value) {
    const list = listStore[key] || [];
    const initialLength = list.length;
    listStore[key] = list.filter(item => item !== String(value));
    return initialLength - listStore[key].length;
  }

  // Giả lập EVAL cho Script Lua Ghép cặp trong match.service.js
  async eval(script, numkeys, key, argv) {
    const list = listStore[key] || [];
    if (list.length === 0) {
      return null;
    }

    // Lấy ứng viên đầu tiên trong hàng chờ
    const candidate = list[0];
    if (candidate === String(argv)) {
      // Nếu là chính mình, quay vòng đẩy xuống cuối hoặc trả về null
      // Theo logic script Lua:
      // redis.call('RPUSH', KEYS[1], candidate)
      // return nil
      list.shift();
      list.push(candidate);
      return null;
    }

    // Nếu là partner hợp lệ, pop ra
    list.shift();
    return candidate;
  }

  async quit() {
    return 'OK';
  }

  async disconnect() {
    return 'OK';
  }
}

export default RedisMock;
export { redisStore, listStore };
