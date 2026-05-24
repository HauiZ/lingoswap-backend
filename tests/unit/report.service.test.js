// tests/unit/report.service.test.js
import * as dbHandler from '../dbHandler.js';
import reportService from '../../src/modules/reports/report.service.js';
import User from '../../src/modules/users/User.js';
import Report from '../../src/modules/reports/Report.js';
import notificationService from '../../src/modules/notifications/notification.service.js';

jest.mock('ioredis');
jest.mock('../../src/modules/notifications/notification.service.js', () => ({
  notifyAllAdmins: jest.fn().mockResolvedValue([])
}));

describe('Unit Test: Report Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let reporter, reportedUser;

  beforeEach(async () => {
    reporter = await User.create({
      email: 'reporter@example.com',
      password: 'Password123!',
      profile: { fullName: 'Reporter User', country: 'vi' }
    });

    reportedUser = await User.create({
      email: 'reported@example.com',
      password: 'Password123!',
      profile: { fullName: 'Reported User', country: 'vi' }
    });
  });

  describe('createReport()', () => {
    test('Nên gửi báo cáo vi phạm thành công', async () => {
      const payload = {
        reportedUserId: reportedUser._id,
        reason: 'Hành vi thô lỗ trong chat room',
        matchSessionId: '507f1f77bcf86cd799439011',
        conversationId: '507f1f77bcf86cd799439012',
        evidenceMessageIds: ['507f1f77bcf86cd799439013']
      };

      const report = await reportService.createReport(reporter._id, payload, null);
      expect(report).toBeDefined();
      expect(report.reporterId.toString()).toBe(reporter._id.toString());
      expect(report.reportedUserId.toString()).toBe(reportedUser._id.toString());
      expect(report.reason).toBe(payload.reason);
      expect(report.matchSessionId.toString()).toBe(payload.matchSessionId);
      expect(report.status).toBe('pending');
    });

    test('Nên báo lỗi khi thiếu thông tin bắt buộc', async () => {
      await expect(
        reportService.createReport(reporter._id, {
          reason: 'Chỉ có lý do'
        }, null)
      ).rejects.toThrow('Thiếu thông tin bắt buộc để báo cáo');
    });

    test('Nên tự động gọi notifyAllAdmins gửi thông báo tới các Admin khi có io', async () => {
      const mockIo = {};
      const payload = {
        reportedUserId: reportedUser._id,
        reason: 'Quấy rối'
      };

      await reportService.createReport(reporter._id, payload, mockIo);
      expect(notificationService.notifyAllAdmins).toHaveBeenCalled();
    });
  });
});
