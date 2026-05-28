// tests/unit/presence.service.test.js
import * as dbHandler from '../dbHandler.js';
import presenceService from '../../src/modules/presence/services/presence.service.js';
import User from '../../src/modules/users/entities/User.js';
import Friendship from '../../src/modules/friends/entities/Friendship.js';
import redis from '../../src/core/config/redis.js';
import { redisStore } from '../__mocks__/ioredis.js';

jest.mock('ioredis');

describe('Unit Test: Presence Service', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => {
    jest.useRealTimers();
    await dbHandler.clear();
    for (const key in redisStore) {
      delete redisStore[key];
    }
    if (userA) {
      await presenceService.setOffline(userA._id.toString(), null);
    }
    if (userB) {
      await presenceService.setOffline(userB._id.toString(), null);
    }
  });
  afterAll(async () => await dbHandler.close());

  let userA, userB;
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  };

  beforeEach(async () => {
    mockIo.to.mockClear();
    mockIo.emit.mockClear();

    userA = await User.create({
      email: 'usera_presence@example.com',
      password: 'Password123!',
      profile: { fullName: 'User A Presence', country: 'vi' }
    });

    userB = await User.create({
      email: 'userb_presence@example.com',
      password: 'Password123!',
      profile: { fullName: 'User B Presence', country: 'vi' }
    });

    // Kết bạn giữa A và B
    await Friendship.create({
      requesterId: userA._id,
      recipientId: userB._id,
      status: 'accepted'
    });
  });

  describe('setOnline() và setOffline()', () => {
    test('Nên đánh dấu user online thành công và đặt socket trong Redis', async () => {
      await presenceService.setOnline(userA._id.toString(), 'socket_a', mockIo);

      expect(presenceService.isOnline(userA._id.toString())).toBe(true);
      expect(await presenceService.getSocketId(userA._id.toString())).toBe('socket_a');
      expect(redisStore[`socket:${userA._id.toString()}`]).toBe('socket_a');
    });

    test('Nên phát sóng thông báo online cho bạn bè khi vừa đăng nhập', async () => {
      // Đặt User B online trước để lắng nghe trạng thái của User A
      await presenceService.setOnline(userB._id.toString(), 'socket_b', mockIo);
      mockIo.to.mockClear();

      // Đăng nhập User A
      await presenceService.setOnline(userA._id.toString(), 'socket_a', mockIo);

      expect(mockIo.to).toHaveBeenCalledWith('socket_b');
      expect(mockIo.emit).toHaveBeenCalledWith('friend_status_change', {
        userId: userA._id.toString(),
        status: 'online'
      });
    });

    test('Nên đánh dấu offline thành công, xóa Redis key, phát sóng thông báo offline', async () => {
      // Đăng nhập cả hai
      await presenceService.setOnline(userB._id.toString(), 'socket_b', mockIo);
      await presenceService.setOnline(userA._id.toString(), 'socket_a', mockIo);

      mockIo.to.mockClear();
      mockIo.emit.mockClear();

      // Cho User A offline
      await presenceService.setOffline(userA._id.toString(), mockIo);

      expect(presenceService.isOnline(userA._id.toString())).toBe(false);
      expect(redisStore[`socket:${userA._id.toString()}`]).toBeUndefined();

      // User B nhận được status offline của A
      expect(mockIo.to).toHaveBeenCalledWith('socket_b');
      expect(mockIo.emit).toHaveBeenCalledWith('friend_status_change', {
        userId: userA._id.toString(),
        status: 'offline'
      });
    });
  });

  describe('scheduleOffline() (TC-R01 - Reconnection Grace Period)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(Friendship, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    test('Luồng hạnh phúc: Ngắt kết nối và tự động reconnect trước 5 giây -> Giữ nguyên online status', async () => {
      await presenceService.setOnline(userA._id.toString(), 'socket_a', mockIo);
      expect(presenceService.isOnline(userA._id.toString())).toBe(true);

      const callback = jest.fn();
      // Ngắt kết nối socket_a
      presenceService.scheduleOffline(userA._id.toString(), 'socket_a', mockIo, callback);
      expect(presenceService.isReconnecting(userA._id.toString())).toBe(true);

      // Reconnect với socket_a_new trước khi hết 5 giây
      await presenceService.setOnline(userA._id.toString(), 'socket_a_new', mockIo);

      // Cho trôi qua 6 giây
      jest.advanceTimersByTime(6000);

      expect(presenceService.isOnline(userA._id.toString())).toBe(true);
      expect(presenceService.isReconnecting(userA._id.toString())).toBe(false);
      expect(callback).not.toHaveBeenCalled();
      expect(await presenceService.getSocketId(userA._id.toString())).toBe('socket_a_new');
    });

    test('Luồng quá hạn: Ngắt kết nối quá 5 giây mà không reconnect -> Bị đưa về offline và kích hoạt callback', async () => {
      await presenceService.setOnline(userA._id.toString(), 'socket_a', mockIo);
      expect(presenceService.isOnline(userA._id.toString())).toBe(true);

      const callback = jest.fn();
      // Ngắt kết nối
      presenceService.scheduleOffline(userA._id.toString(), 'socket_a', mockIo, callback);
      expect(presenceService.isReconnecting(userA._id.toString())).toBe(true);

      // Tiến thời gian trôi qua 6 giây
      jest.advanceTimersByTime(6000);

      // Flush microtasks
      await Promise.resolve();
      await new Promise(resolve => jest.requireActual('timers').setImmediate(resolve));

      expect(presenceService.isOnline(userA._id.toString())).toBe(false);
      expect(presenceService.isReconnecting(userA._id.toString())).toBe(false);
      expect(callback).toHaveBeenCalled();
    });
  });
});
