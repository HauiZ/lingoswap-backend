// tests/unit/user.service.test.js
import * as dbHandler from '../dbHandler.js';
import userService from '../../src/modules/users/user.service.js';
import authService from '../../src/modules/auth/auth.service.js';
import User from '../../src/modules/users/User.js';
import Appeal from '../../src/modules/users/Appeal.js';
import Friendship from '../../src/modules/friends/Friendship.js';
import Conversation from '../../src/modules/chat/Conversation.js';
import presenceService from '../../src/modules/presence/presence.service.js';

jest.mock('ioredis');

describe('Unit Test: User Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let user;
  const mockUserPayload = {
    email: 'testuser@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    fullName: 'Nguyen Van Test',
    country: 'Vietnam'
  };

  beforeEach(async () => {
    user = await authService.register(mockUserPayload);
  });

  describe('getUserById()', () => {
    test('Nên lấy thông tin user theo ID thành công', async () => {
      const foundUser = await userService.getUserById(user._id);
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(mockUserPayload.email.toLowerCase());
    });

    test('Nên báo lỗi khi ID không tồn tại', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await expect(userService.getUserById(fakeId)).rejects.toThrow('Người dùng không tồn tại');
    });
  });

  describe('updateMyProfile()', () => {
    test('Nên cập nhật profile thành công', async () => {
      const updatedProfile = {
        fullName: 'Nguyen Van NewName',
        country: 'Japan',
        nativeLanguages: ['vi'],
        targetLanguages: ['ja']
      };

      const updatedUser = await userService.updateMyProfile(user._id, { profile: updatedProfile });
      expect(updatedUser.profile.fullName).toBe('Nguyen Van NewName');
      expect(updatedUser.profile.country).toBe('Japan');
    });

    test('Nên cập nhật settings thành công', async () => {
      const updatedSettings = {
        uiLanguage: 'vi',
        theme: 'dark'
      };

      const updatedUser = await userService.updateMyProfile(user._id, { settings: updatedSettings });
      expect(updatedUser.settings.uiLanguage).toBe('vi');
      expect(updatedUser.settings.theme).toBe('dark');
    });
  });

  describe('uploadAvatar()', () => {
    test('Nên cập nhật link ảnh đại diện', async () => {
      const mockFile = { path: 'https://res.cloudinary.com/mock/image.png' };
      const path = await userService.uploadAvatar(user._id, mockFile);
      expect(path).toBe(mockFile.path);

      const dbUser = await User.findById(user._id);
      expect(dbUser.profile.avatar).toBe(mockFile.path);
    });

    test('Nên báo lỗi khi không cung cấp file', async () => {
      await expect(userService.uploadAvatar(user._id, null)).rejects.toThrow('Vui lòng cung cấp file ảnh');
    });
  });

  describe('getUserDashboard()', () => {
    test('Nên lấy dashboard tổng quan của user thành công', async () => {
      const dashboard = await userService.getUserDashboard(user._id);
      expect(dashboard).toBeDefined();
      expect(dashboard.greeting).toContain(user.profile.fullName.split(' ').pop());
      expect(dashboard.stats.streak).toBe(0);
      expect(dashboard.stats.totalHours).toBe(0);
      expect(dashboard.stats.totalSessions).toBe(0);
    });
  });

  describe('Lazy Streak Reset Logic', () => {
    test('Nên giữ nguyên streak khi lastStreakUpdate là hôm nay', async () => {
      const now = new Date();
      await User.findByIdAndUpdate(user._id, {
        'stats.streak': 5,
        'stats.lastStreakUpdate': now
      });

      const profile = await userService.getMyProfile(user._id);
      expect(profile.stats.streak).toBe(5);
    });

    test('Nên giữ nguyên streak khi lastStreakUpdate là hôm qua', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(user._id, {
        'stats.streak': 5,
        'stats.lastStreakUpdate': yesterday
      });

      const profile = await userService.getMyProfile(user._id);
      expect(profile.stats.streak).toBe(5);
    });

    test('Nên reset streak về 0 khi lastStreakUpdate cách đây 2 ngày', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      await User.findByIdAndUpdate(user._id, {
        'stats.streak': 5,
        'stats.lastStreakUpdate': twoDaysAgo
      });

      const profile = await userService.getMyProfile(user._id);
      expect(profile.stats.streak).toBe(0);

      const dbUser = await User.findById(user._id);
      expect(dbUser.stats.streak).toBe(0);
      expect(new Date(dbUser.stats.lastStreakUpdate).toDateString()).toBe(twoDaysAgo.toDateString());
    });
  });

  describe('searchUsers()', () => {
    let userB;
    beforeEach(async () => {
      userB = await authService.register({
        email: 'searchb@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Jane Doe',
        country: 'US'
      });
    });

    test('Nên tìm kiếm người dùng theo tên thành công', async () => {
      const result = await userService.searchUsers(user._id, 'Jane');
      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(1);
      expect(result.results[0].fullName).toBe('Jane Doe');
      expect(result.results[0].isFriend).toBe(false);
    });

    test('Nên tìm kiếm người dùng là bạn bè và xếp lên đầu', async () => {
      // Kết bạn giữa user và userB
      await Friendship.create({
        requesterId: user._id,
        recipientId: userB._id,
        status: 'accepted'
      });

      const result = await userService.searchUsers(user._id, 'Jane');
      expect(result.results[0].isFriend).toBe(true);
    });
  });

  describe('searchFriends()', () => {
    let userB, userC;
    beforeEach(async () => {
      userB = await authService.register({
        email: 'friendb@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Friend B',
        country: 'US'
      });
      userC = await authService.register({
        email: 'friendc@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Friend C',
        country: 'US'
      });

      // Kết bạn với B và C
      await Friendship.create([
        { requesterId: user._id, recipientId: userB._id, status: 'accepted' },
        { requesterId: user._id, recipientId: userC._id, status: 'accepted' }
      ]);
    });

    test('Nên tìm kiếm và trả về danh sách bạn bè', async () => {
      const result = await userService.searchFriends(user._id, 'Friend');
      expect(result.results.length).toBe(2);
      expect(result.results.map(f => f.fullName)).toContain('Friend B');
      expect(result.results.map(f => f.fullName)).toContain('Friend C');
    });

    test('Nên sắp xếp bạn bè có tương tác gần nhất lên đầu', async () => {
      // Tạo cuộc hội thoại giả với C có tương tác gần nhất
      const convC = await Conversation.create({
        participants: [user._id, userC._id],
        lastMessage: '507f1f77bcf86cd799439013'
      });
      await Conversation.findByIdAndUpdate(convC._id, { updatedAt: new Date(Date.now() + 10000) }, { timestamps: false });

      const convB = await Conversation.create({
        participants: [user._id, userB._id],
        lastMessage: '507f1f77bcf86cd799439014'
      });
      await Conversation.findByIdAndUpdate(convB._id, { updatedAt: new Date(Date.now() - 10000) }, { timestamps: false });

      const result = await userService.searchFriends(user._id, 'Friend');
      expect(result.results[0].fullName).toBe('Friend C');
      expect(result.results[1].fullName).toBe('Friend B');
    });
  });

  describe('submitAppeal()', () => {
    test('Nên gửi đơn kháng cáo thành công khi tài khoản bị banned', async () => {
      // Đặt trạng thái ban
      await User.findByIdAndUpdate(user._id, { statusAccount: 'banned' });

      const appeal = await userService.submitAppeal(user._id, 'Tài khoản của tôi bị nhầm lẫn');
      expect(appeal).toBeDefined();
      expect(appeal.reason).toBe('Tài khoản của tôi bị nhầm lẫn');
      expect(appeal.status).toBe('pending');

      const appealInDb = await Appeal.findOne({ userId: user._id });
      expect(appealInDb).toBeDefined();
    });

    test('Nên báo lỗi khi tài khoản không ở trạng thái bị khóa', async () => {
      await expect(userService.submitAppeal(user._id, 'Lý do')).rejects.toThrow('Tài khoản của bạn không ở trạng thái bị khóa');
    });

    test('Nên báo lỗi khi có đơn kháng cáo pending khác', async () => {
      await User.findByIdAndUpdate(user._id, { statusAccount: 'banned' });
      await userService.submitAppeal(user._id, 'Lý do 1');

      await expect(userService.submitAppeal(user._id, 'Lý do 2')).rejects.toThrow('Bạn đã có một đơn kháng cáo đang chờ xử lý. Vui lòng kiên nhẫn.');
    });
  });
});
