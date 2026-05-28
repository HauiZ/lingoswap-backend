// tests/unit/admin.service.test.js
import * as dbHandler from '../dbHandler.js';
import adminService from '../../src/modules/admin/services/admin.service.js';
import User from '../../src/modules/users/entities/User.js';
import Report from '../../src/modules/reports/entities/Report.js';
import Appeal from '../../src/modules/users/entities/Appeal.js';
import MatchSession from '../../src/modules/match/entities/MatchSession.js';

// Mock các dịch vụ ngoài
jest.mock('ioredis');
jest.mock('../../src/core/utils/sendEmail.js', () => {
  return jest.fn().mockResolvedValue(true);
});

describe('Unit Test: Admin Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  const mockAdminPayload = {
    email: 'admin@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    fullName: 'System Admin'
  };

  describe('createAdmin()', () => {
    test('Nên tạo tài khoản Admin mới thành công', async () => {
      const admin = await adminService.createAdmin(mockAdminPayload);
      expect(admin).toBeDefined();
      expect(admin.email).toBe(mockAdminPayload.email.toLowerCase());
      expect(admin.role).toBe('admin');
      expect(admin.profile.fullName).toBe(mockAdminPayload.fullName);
    });

    test('Nên báo lỗi khi thiếu thông tin đăng ký', async () => {
      await expect(
        adminService.createAdmin({
          email: 'admin2@example.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('Vui lòng cung cấp đầy đủ thông tin bắt buộc');
    });

    test('Nên báo lỗi khi email đã tồn tại', async () => {
      await adminService.createAdmin(mockAdminPayload);
      await expect(adminService.createAdmin(mockAdminPayload)).rejects.toThrow('Email đã được sử dụng');
    });
  });

  describe('banUser() và deleteUser()', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'baduser@example.com',
        password: 'Password123!',
        profile: { fullName: 'Bad User', country: 'vi' }
      });
    });

    test('Nên khóa tài khoản người dùng vĩnh viễn thành công', async () => {
      const bannedUser = await adminService.banUser(testUser._id);
      expect(bannedUser).toBeDefined();
      expect(bannedUser.statusAccount).toBe('banned');
      expect(bannedUser.bannedUntil).toBeNull();
    });

    test('Nên xóa vĩnh viễn user thành công', async () => {
      const deletedUser = await adminService.deleteUser(testUser._id);
      expect(deletedUser).toBeDefined();
      expect(deletedUser.email).toBe(testUser.email);

      const dbUser = await User.findById(testUser._id);
      expect(dbUser).toBeNull();
    });
  });

  describe('resolveReport()', () => {
    let reporter, reportedUser, mockReport, admin;

    beforeEach(async () => {
      admin = await adminService.createAdmin(mockAdminPayload);
      reporter = await User.create({
        email: 'reporter@example.com',
        password: 'Password123!',
        profile: { fullName: 'Reporter', country: 'vi' }
      });
      reportedUser = await User.create({
        email: 'reported@example.com',
        password: 'Password123!',
        profile: { fullName: 'Reported User', country: 'vi' }
      });
      mockReport = await Report.create({
        reporterId: reporter._id,
        reportedUserId: reportedUser._id,
        reason: 'Spamming',
        status: 'pending'
      });
    });

    test('Nên xử lý báo cáo vi phạm và khóa tài khoản 3 ngày', async () => {
      const resolved = await adminService.resolveReport(mockReport._id, admin._id, {
        status: 'resolved',
        adminNotes: 'Spamming and annoying users',
        banDuration: '3_days'
      });

      expect(resolved).toBeDefined();
      expect(resolved.status).toBe('resolved');
      expect(resolved.adminNotes).toBe('Spamming and annoying users');
      expect(resolved.resolvedByAdminId.toString()).toBe(admin._id.toString());

      const dbReportedUser = await User.findById(reportedUser._id);
      expect(dbReportedUser.statusAccount).toBe('banned');
      expect(dbReportedUser.bannedUntil).toBeDefined();
      expect(dbReportedUser.bannedUntil.getTime()).toBeGreaterThan(Date.now());
    });

    test('Nên xử lý báo cáo vi phạm và khóa tài khoản vĩnh viễn', async () => {
      const resolved = await adminService.resolveReport(mockReport._id, admin._id, {
        status: 'resolved',
        adminNotes: 'Severe violation',
        banDuration: 'permanent'
      });

      expect(resolved).toBeDefined();
      expect(resolved.status).toBe('resolved');

      const dbReportedUser = await User.findById(reportedUser._id);
      expect(dbReportedUser.statusAccount).toBe('banned');
      expect(dbReportedUser.bannedUntil).toBeNull();
    });
  });

  describe('getAllAppeals() và resolveAppeal()', () => {
    let bannedUser, mockAppeal, admin;

    beforeEach(async () => {
      admin = await adminService.createAdmin(mockAdminPayload);
      bannedUser = await User.create({
        email: 'banned@example.com',
        password: 'Password123!',
        statusAccount: 'banned',
        profile: { fullName: 'Banned User', country: 'vi' }
      });
      mockAppeal = await Appeal.create({
        userId: bannedUser._id,
        reason: 'Xin hãy tha thứ cho tôi'
      });
    });

    test('Nên lấy danh sách đơn kháng cáo thành công', async () => {
      const appeals = await adminService.getAllAppeals('pending');
      expect(appeals).toBeDefined();
      expect(appeals.length).toBeGreaterThanOrEqual(1);
      expect(appeals[0].reason).toBe('Xin hãy tha thứ cho tôi');
    });

    test('Nên chấp thuận đơn kháng cáo và mở khóa tài khoản', async () => {
      const resolved = await adminService.resolveAppeal(mockAppeal._id, admin._id, {
        status: 'approved',
        adminNotes: 'Chấp nhận lời giải thích của bạn'
      });

      expect(resolved).toBeDefined();
      expect(resolved.status).toBe('approved');
      expect(resolved.resolvedByAdminId.toString()).toBe(admin._id.toString());

      const dbUser = await User.findById(bannedUser._id);
      expect(dbUser.statusAccount).toBe('active');
      expect(dbUser.bannedUntil).toBeNull();
    });

    test('Nên từ chối đơn kháng cáo và giữ nguyên khóa tài khoản', async () => {
      const resolved = await adminService.resolveAppeal(mockAppeal._id, admin._id, {
        status: 'rejected',
        adminNotes: 'Kháng cáo không hợp lệ'
      });

      expect(resolved).toBeDefined();
      expect(resolved.status).toBe('rejected');

      const dbUser = await User.findById(bannedUser._id);
      expect(dbUser.statusAccount).toBe('banned');
    });
  });
});
