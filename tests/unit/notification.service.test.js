// tests/unit/notification.service.test.js
import * as dbHandler from '../dbHandler.js';
import notificationService from '../../src/modules/notifications/services/notification.service.js';
import Notification from '../../src/modules/notifications/entities/Notification.js';
import User from '../../src/modules/users/entities/User.js';
import redis from '../../src/core/config/redis.js';

jest.mock('ioredis');

describe('Unit Test: Notification Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let user, sender, admin;

  beforeEach(async () => {
    user = await User.create({
      email: 'user@example.com',
      password: 'Password123!',
      profile: { fullName: 'Regular User', country: 'vi' }
    });

    sender = await User.create({
      email: 'sender@example.com',
      password: 'Password123!',
      profile: { fullName: 'Sender User', country: 'vi' }
    });

    admin = await User.create({
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin',
      profile: { fullName: 'Admin User', country: 'vi' }
    });
  });

  describe('createAndPush()', () => {
    test('Nên tạo thông báo và lưu vào DB thành công', async () => {
      const payload = {
        recipientId: user._id,
        senderId: sender._id,
        type: 'friend_request',
        content: 'Sender User đã gửi yêu cầu kết bạn.',
        metadata: { friendshipId: '507f1f77bcf86cd799439011' }
      };

      const result = await notificationService.createAndPush(null, payload);
      expect(result).toBeDefined();
      expect(result.recipientId.toString()).toBe(user._id.toString());
      expect(result.senderId._id.toString()).toBe(sender._id.toString());
      expect(result.type).toBe('friend_request');
      expect(result.content).toBe('Sender User đã gửi yêu cầu kết bạn.');
      expect(result.isRead).toBe(false);
    });

    test('Nên push realtime qua Socket nếu recipient online', async () => {
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };

      // Mock user online bằng cách đặt socket ID trong redis
      await redis.set(`socket:${user._id}`, 'mock_socket_id');

      const payload = {
        recipientId: user._id,
        senderId: sender._id,
        type: 'friend_request',
        content: 'Lời mời mới'
      };

      await notificationService.createAndPush(mockIo, payload);
      expect(mockIo.to).toHaveBeenCalledWith('mock_socket_id');
      expect(mockIo.emit).toHaveBeenCalledWith('new_notification', expect.any(Object));
    });
  });

  describe('notifyAllAdmins()', () => {
    test('Nên gửi thông báo đồng loạt tới tất cả admin', async () => {
      const payload = {
        senderId: sender._id,
        type: 'report_new',
        content: 'Báo cáo vi phạm mới'
      };

      const results = await notificationService.notifyAllAdmins(null, payload);
      expect(results).toBeDefined();
      expect(results.length).toBe(1); // Chỉ có 1 admin trong DB của test
      expect(results[0].recipientId.toString()).toBe(admin._id.toString());
    });
  });

  describe('getNotifications() và countUnread()', () => {
    beforeEach(async () => {
      await Notification.create([
        { recipientId: user._id, senderId: sender._id, type: 'system', content: 'Tin nhắn 1', isRead: false },
        { recipientId: user._id, senderId: sender._id, type: 'system', content: 'Tin nhắn 2', isRead: true }
      ]);
    });

    test('Nên lấy danh sách thông báo chính xác', async () => {
      const list = await notificationService.getNotifications(user._id);
      expect(list).toBeDefined();
      expect(list.length).toBe(2);
      expect(list[0].senderId._id.toString()).toBe(sender._id.toString());
    });

    test('Nên đếm đúng số thông báo chưa đọc', async () => {
      const count = await notificationService.countUnread(user._id);
      expect(count).toBe(1);
    });
  });

  describe('markAsRead()', () => {
    let notif1, notif2;

    beforeEach(async () => {
      notif1 = await Notification.create({ recipientId: user._id, type: 'system', content: 'Tin nhắn 1', isRead: false });
      notif2 = await Notification.create({ recipientId: user._id, type: 'system', content: 'Tin nhắn 2', isRead: false });
    });

    test('Nên đánh dấu một thông báo đã đọc', async () => {
      await notificationService.markAsRead(user._id, notif1._id);
      const dbNotif1 = await Notification.findById(notif1._id);
      const dbNotif2 = await Notification.findById(notif2._id);
      expect(dbNotif1.isRead).toBe(true);
      expect(dbNotif2.isRead).toBe(false);
    });

    test('Nên đánh dấu tất cả thông báo đã đọc', async () => {
      await notificationService.markAsRead(user._id, null);
      const dbNotif1 = await Notification.findById(notif1._id);
      const dbNotif2 = await Notification.findById(notif2._id);
      expect(dbNotif1.isRead).toBe(true);
      expect(dbNotif2.isRead).toBe(true);
    });

    test('BE82: Nên chặn/không cập nhật thông báo khi người dùng khác cố ý đánh dấu đã đọc', async () => {
      const res = await notificationService.markAsRead(sender._id, notif1._id);
      expect(res).toBeNull();

      const dbNotif1 = await Notification.findById(notif1._id);
      expect(dbNotif1.isRead).toBe(false);
    });
  });
});
