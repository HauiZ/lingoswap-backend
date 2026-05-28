// tests/unit/friend.service.test.js
import * as dbHandler from '../dbHandler.js';
import friendService from '../../src/modules/friends/services/friend.service.js';
import authService from '../../src/modules/auth/services/auth.service.js';
import Friendship from '../../src/modules/friends/entities/Friendship.js';

jest.mock('ioredis');
jest.mock('../../src/modules/notifications/services/notification.service.js', () => ({
  createAndPush: jest.fn().mockResolvedValue(true),
  updateNotificationContent: jest.fn().mockResolvedValue(true)
}));

describe('Unit Test: Friend Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let userA, userB;
  const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  };

  beforeEach(async () => {
    userA = await authService.register({
      email: 'usera@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User A',
      country: 'Vietnam'
    });

    userB = await authService.register({
      email: 'userb@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User B',
      country: 'Vietnam'
    });
  });

  describe('sendFriendRequest()', () => {
    test('Nên gửi yêu cầu kết bạn thành công', async () => {
      const friendship = await friendService.sendFriendRequest(userA._id, userB._id, mockIo);
      expect(friendship).toBeDefined();
      expect(friendship.requesterId.toString()).toBe(userA._id.toString());
      expect(friendship.recipientId.toString()).toBe(userB._id.toString());
      expect(friendship.status).toBe('pending');
    });

    test('Nên báo lỗi khi tự kết bạn với chính mình', async () => {
      await expect(
        friendService.sendFriendRequest(userA._id, userA._id, mockIo)
      ).rejects.toThrow('Không thể gửi yêu cầu kết bạn cho chính mình');
    });

    test('Nên báo lỗi nếu đã là bạn bè', async () => {
      const f = await friendService.sendFriendRequest(userA._id, userB._id, mockIo);
      await friendService.responseFriendRequest(userB._id, f._id, 'accept', mockIo);

      await expect(
        friendService.sendFriendRequest(userA._id, userB._id, mockIo)
      ).rejects.toThrow('Các bạn đã là bạn bè');
    });
  });

  describe('responseFriendRequest()', () => {
    test('Nên đồng ý kết bạn thành công', async () => {
      const request = await friendService.sendFriendRequest(userA._id, userB._id, mockIo);
      const res = await friendService.responseFriendRequest(userB._id, request._id, 'accept', mockIo);
      expect(res).toBe('Đã chấp nhận yêu cầu kết bạn');

      const status = await friendService.checkFriendshipStatus(userA._id, userB._id);
      expect(status.status).toBe('friends');
    });

    test('Nên từ chối kết bạn thành công', async () => {
      const request = await friendService.sendFriendRequest(userA._id, userB._id, mockIo);
      const res = await friendService.responseFriendRequest(userB._id, request._id, 'reject', mockIo);
      expect(res).toBe('Đã từ chối yêu cầu kết bạn');

      const status = await friendService.checkFriendshipStatus(userA._id, userB._id);
      expect(status.status).toBe('none');
    });

    test('Nên báo lỗi khi người khác phản hồi thay recipient', async () => {
      const request = await friendService.sendFriendRequest(userA._id, userB._id, mockIo);
      await expect(
        friendService.responseFriendRequest(userA._id, request._id, 'accept', mockIo)
      ).rejects.toThrow('Không có quyền thực hiện hành động này');
    });
  });

  describe('removeFriend()', () => {
    test('Nên hủy kết bạn thành công', async () => {
      const request = await friendService.sendFriendRequest(userA._id, userB._id, mockIo);
      await friendService.responseFriendRequest(userB._id, request._id, 'accept', mockIo);

      const res = await friendService.removeFriend(userA._id, userB._id, mockIo);
      expect(res).toBe('Đã hủy kết bạn');

      const status = await friendService.checkFriendshipStatus(userA._id, userB._id);
      expect(status.status).toBe('none');
    });
  });
});
