// tests/unit/match.service.test.js
import * as dbHandler from '../dbHandler.js';
import * as matchService from '../../src/modules/match/match.service.js';
import authService from '../../src/modules/auth/auth.service.js';
import User from '../../src/modules/users/User.js';
import MatchSession from '../../src/modules/match/MatchSession.js';
import { listStore } from '../__mocks__/ioredis.js';
import redis from '../../src/core/config/redis.js';

jest.mock('ioredis');

describe('Unit Test: Match Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => {
    await dbHandler.clear();
    // Dọn sạch danh sách hàng chờ giả lập sau mỗi bài test
    for (const key in listStore) {
      delete listStore[key];
    }
  });
  afterAll(async () => await dbHandler.close());

  let userA, userB;

  beforeEach(async () => {
    userA = await authService.register({
      email: 'matcha@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Match User A',
      country: 'Vietnam'
    });

    userB = await authService.register({
      email: 'matchb@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Match User B',
      country: 'Japan'
    });
  });

  describe('findOrQueuePartnerService()', () => {
    test('Nên đưa User A vào hàng chờ khi chưa có ai', async () => {
      const res = await matchService.findOrQueuePartnerService(userA._id, 'english');
      expect(res.status).toBe('waiting');

      const dbUser = await User.findById(userA._id);
      expect(dbUser.status).toBe('waiting');
    });

    test('Nên thông báo nếu đã có trong hàng chờ', async () => {
      await matchService.findOrQueuePartnerService(userA._id, 'english');
      const res = await matchService.findOrQueuePartnerService(userA._id, 'english');
      expect(res.status).toBe('already_waiting');
    });

    test('Nên ghép cặp thành công khi User B tìm cùng ngôn ngữ', async () => {
      // 1. User A vào hàng chờ trước
      await matchService.findOrQueuePartnerService(userA._id, 'english');

      // 2. User B vào hàng chờ
      const res = await matchService.findOrQueuePartnerService(userB._id, 'english');
      expect(res.status).toBe('match_found');
      expect(res.partnerId.toString()).toBe(userA._id.toString());
      expect(res.sessionId).toBeDefined();

      // Kiểm tra trạng thái của cả hai user
      const dbA = await User.findById(userA._id);
      const dbB = await User.findById(userB._id);
      expect(dbA.status).toBe('in-call');
      expect(dbB.status).toBe('in-call');

      // Kiểm tra MatchSession được tạo
      const session = await MatchSession.findById(res.sessionId);
      expect(session).toBeDefined();
      expect(session.status).toBe('ongoing');
      expect(session.language).toBe('english');
      expect(session.participants.map(p => p.toString())).toContain(userA._id.toString());
      expect(session.participants.map(p => p.toString())).toContain(userB._id.toString());
    });

    test('BE25: Tự ghép cặp với chính mình trong hàng chờ', async () => {
      const queueKey = 'queue:english';
      // Giả lập hàng chờ có sẵn chính mình
      listStore[queueKey] = [userA._id.toString()];

      // Spy lpos để trả về null, giả lập vượt qua check lpos
      jest.spyOn(redis, 'lpos').mockResolvedValueOnce(null);

      const res = await matchService.findOrQueuePartnerService(userA._id, 'english');
      
      // Do lấy ra chính mình nên phải tự rpush lại và trả về waiting
      expect(res.status).toBe('waiting');
      expect(listStore[queueKey]).toContain(userA._id.toString());
    });
  });

  describe('handleQueueTimeoutService()', () => {
    test('Nên rút người dùng khỏi hàng chờ khi timeout', async () => {
      await matchService.findOrQueuePartnerService(userA._id, 'english');
      const removed = await matchService.handleQueueTimeoutService(userA._id, 'english');
      expect(removed).toBe(true);

      const dbUser = await User.findById(userA._id);
      expect(dbUser.status).toBe('idle');
    });
  });

  describe('leaveMatchAndQueueService()', () => {
    test('Nên kết thúc session, dọn dẹp hàng chờ và cập nhật stats học tập cho user', async () => {
      // 1. Tạo ghép cặp
      await matchService.findOrQueuePartnerService(userA._id, 'english');
      const match = await matchService.findOrQueuePartnerService(userB._id, 'english');
      
      // Giả lập thời gian gọi (30 phút trước để pre-save hook tự tính 1800 giây)
      const startTime = new Date(Date.now() - 1800 * 1000);
      await MatchSession.findByIdAndUpdate(match.sessionId, { startedAt: startTime });

      // 2. User A rời cuộc gọi
      const res = await matchService.leaveMatchAndQueueService(userA._id.toString(), 'english');
      expect(res.activeSession).toBeDefined();
      expect(res.partnerId.toString()).toBe(userB._id.toString());

      // 3. Kiểm tra Session đã kết thúc
      const session = await MatchSession.findById(match.sessionId);
      expect(session.status).toBe('completed');
      expect(session.endedAt).toBeDefined();

      // 4. Kiểm tra stats của user được cập nhật
      const dbA = await User.findById(userA._id);
      expect(dbA.status).toBe('idle');
      expect(dbA.stats.totalSessions).toBe(1);
      expect(dbA.stats.totalHours).toBeCloseTo(0.5, 1);
      expect(dbA.stats.streak).toBe(1); // Streak khởi tạo ban đầu
    });
  });

  describe('Direct Call Services (BE60 & BE61)', () => {
    test('BE60: requestDirectMatchService() nên trả về socketId của targetUser nếu online', async () => {
      // Đặt socket targetUser vào redis
      await redis.set(`socket:${userB._id}`, 'mock_socket_b');

      const socketId = await matchService.requestDirectMatchService(userA._id, userB._id);
      expect(socketId).toBe('mock_socket_b');
    });

    test('BE60: requestDirectMatchService() nên báo lỗi khi người dùng offline', async () => {
      // Xóa socket targetUser khỏi redis
      await redis.del(`socket:${userB._id}`);

      await expect(
        matchService.requestDirectMatchService(userA._id, userB._id)
      ).rejects.toThrow('Người dùng hiện đang offline.');
    });

    test('BE61: acceptDirectMatchService() nên khởi tạo cuộc gọi trực tiếp thành công', async () => {
      const result = await matchService.acceptDirectMatchService(userA._id, userB._id);
      expect(result.sessionId).toBeDefined();

      const session = await MatchSession.findById(result.sessionId);
      expect(session.participants.map(p => p.toString())).toContain(userA._id.toString());
      expect(session.participants.map(p => p.toString())).toContain(userB._id.toString());
      expect(session.language).toBe('any');
      expect(session.status).toBe('ongoing');

      const dbA = await User.findById(userA._id);
      const dbB = await User.findById(userB._id);
      expect(dbA.status).toBe('in-call');
      expect(dbB.status).toBe('in-call');
    });
  });

  describe('Streak Gamification Logic (BE84 - BE88)', () => {
    test('BE84 & BE88: End call duration > 0 lần đầu tiên trong ngày nên tăng streak thành 1', async () => {
      // Đặt streak hiện tại là 0
      await User.findByIdAndUpdate(userA._id, { 'stats.streak': 0, 'stats.lastStreakUpdate': null });

      const session = await MatchSession.create({
        participants: [userA._id, userB._id],
        language: 'english',
        status: 'ongoing',
        startedAt: new Date(Date.now() - 30 * 1000) // Call 30 seconds
      });

      const res = await matchService.leaveMatchAndQueueService(userA._id.toString(), 'english');
      expect(res.updatedStreaks.length).toBeGreaterThan(0);
      expect(res.updatedStreaks.find(u => u.userId === userA._id.toString()).streak).toBe(1);
    });

    test('BE85: End call lần thứ 2 trong cùng ngày không được tăng tiếp streak', async () => {
      // Đặt streak hiện tại là 1, đã được cập nhật hôm nay
      await User.findByIdAndUpdate(userA._id, { 
        'stats.streak': 1, 
        'stats.lastStreakUpdate': new Date() 
      });

      const session = await MatchSession.create({
        participants: [userA._id, userB._id],
        language: 'english',
        status: 'ongoing',
        startedAt: new Date(Date.now() - 30 * 1000)
      });

      const res = await matchService.leaveMatchAndQueueService(userA._id.toString(), 'english');
      const userAStreakUpdate = res.updatedStreaks.find(u => u.userId === userA._id.toString());
      expect(userAStreakUpdate).toBeUndefined();
    });

    test('BE86: End call hôm sau liên tiếp nên tăng streak lên +1 (streak = 2)', async () => {
      // Đặt streak hiện tại là 1, lần cập nhật cuối là ngày hôm qua
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(userA._id, { 
        'stats.streak': 1, 
        'stats.lastStreakUpdate': yesterday 
      });

      const session = await MatchSession.create({
        participants: [userA._id, userB._id],
        language: 'english',
        status: 'ongoing',
        startedAt: new Date(Date.now() - 30 * 1000)
      });

      const res = await matchService.leaveMatchAndQueueService(userA._id.toString(), 'english');
      expect(res.updatedStreaks.find(u => u.userId === userA._id.toString()).streak).toBe(2);
    });

    test('BE87: End call sau khi bị đứt chuỗi (hơn 1 ngày) nên reset streak về 1', async () => {
      // Đặt streak hiện tại là 5, lần cập nhật cuối là 3 ngày trước (bị đứt chuỗi)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(userA._id, { 
        'stats.streak': 5, 
        'stats.lastStreakUpdate': threeDaysAgo 
      });

      const session = await MatchSession.create({
        participants: [userA._id, userB._id],
        language: 'english',
        status: 'ongoing',
        startedAt: new Date(Date.now() - 30 * 1000)
      });

      const res = await matchService.leaveMatchAndQueueService(userA._id.toString(), 'english');
      expect(res.updatedStreaks.find(u => u.userId === userA._id.toString()).streak).toBe(1);
    });

    test('BE88: End call duration = 0 không được phép cập nhật streak', async () => {
      await User.findByIdAndUpdate(userA._id, { 'stats.streak': 0, 'stats.lastStreakUpdate': null });

      const session = await MatchSession.create({
        participants: [userA._id, userB._id],
        language: 'english',
        status: 'ongoing',
        startedAt: new Date() 
      });

      const res = await matchService.leaveMatchAndQueueService(userA._id.toString(), 'english');
      expect(res.updatedStreaks.length).toBe(0); 
    });
  });
});
