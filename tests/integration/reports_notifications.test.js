// tests/integration/reports_notifications.test.js
import request from 'supertest';
import * as dbHandler from '../dbHandler.js';
import User from '../../src/modules/users/User.js';
import Notification from '../../src/modules/notifications/Notification.js';

// Mock DB connection và Redis
jest.mock('../../src/core/config/database.js', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});
jest.mock('ioredis');

import app from '../../src/app.js';

describe('Integration Test: Reports & Notifications API', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let adminToken, userBToken, userCToken, adminId, idB, idC;

  beforeEach(async () => {
    // 1. Tài khoản Admin A
    await request(app).post('/api/auth/register').send({
      email: 'admin_rn@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Super Admin RN',
      country: 'Vietnam'
    });
    const adminUser = await User.findOne({ email: 'admin_rn@example.com' });
    adminUser.role = 'admin';
    await adminUser.save();
    adminId = adminUser._id;

    const logAdmin = await request(app).post('/api/auth/login').send({
      email: 'admin_rn@example.com',
      password: 'Password123!'
    });
    adminToken = logAdmin.body.token;

    // 2. Tài khoản User B
    await request(app).post('/api/auth/register').send({
      email: 'userb_rn@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User B RN',
      country: 'Vietnam'
    });
    const logB = await request(app).post('/api/auth/login').send({
      email: 'userb_rn@example.com',
      password: 'Password123!'
    });
    userBToken = logB.body.token;
    idB = logB.body.id;

    // 3. Tài khoản User C
    await request(app).post('/api/auth/register').send({
      email: 'userc_rn@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User C RN',
      country: 'Vietnam'
    });
    const logC = await request(app).post('/api/auth/login').send({
      email: 'userc_rn@example.com',
      password: 'Password123!'
    });
    userCToken = logC.body.token;
    idC = logC.body.id;
  });

  test('Luồng Báo cáo & Thông báo (POST /user/reports, GET /admin/reports, PATCH /admin/reports/:id/status, GET /user/notifications, GET /unread/count, PATCH /notifications/:id/status): Nên hoàn tất chuỗi: Gửi Báo cáo -> Admin duyệt Báo cáo -> Kiểm tra & Thao tác Thông báo', async () => {
    // Bước 1: User B gửi báo cáo tố cáo User C vì hành vi xúc phạm
    const reportRes = await request(app)
      .post('/api/user/reports')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        reportedUserId: idC,
        reason: 'xúc phạm',
        evidenceMessageIds: []
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.message).toBe('Gửi báo cáo vi phạm thành công');
    const reportId = reportRes.body.report._id;

    // Bước 2: Admin lấy danh sách báo cáo vi phạm
    const reportsRes = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body.length).toBe(1);
    expect(reportsRes.body[0]._id.toString()).toBe(reportId.toString());

    // Bước 3: Admin duyệt và xử lý báo cáo vi phạm
    const resolveRes = await request(app)
      .patch(`/api/admin/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        adminNotes: ' confirmed abuse behavior.'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.report.status).toBe('resolved');

    // Bước 4: Tạo thủ công một thông báo cho User B để giả lập thông báo gửi về
    const notif = await Notification.create({
      recipientId: idB,
      senderId: adminId,
      type: 'report_handled',
      content: 'Báo cáo của bạn đối với User C đã được giải quyết.',
      isRead: false
    });

    // Bước 5: User B lấy danh sách thông báo
    const notifsRes = await request(app)
      .get('/api/user/notifications')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(notifsRes.status).toBe(200);
    expect(notifsRes.body.length).toBe(1);
    expect(notifsRes.body[0].content).toContain('User C đã được giải quyết');

    // Bước 6: User B kiểm tra số lượng thông báo chưa đọc
    const countRes = await request(app)
      .get('/api/user/notifications/unread/count')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.unreadCount).toBe(1);

    // Bước 7: User B đánh dấu thông báo đã đọc
    const readRes = await request(app)
      .patch(`/api/user/notifications/${notif._id}/status`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.message).toBe('Đã đánh dấu đã đọc');

    // Bước 8: Kiểm tra lại số lượng chưa đọc trở về 0
    const countFinal = await request(app)
      .get('/api/user/notifications/unread/count')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(countFinal.body.unreadCount).toBe(0);
  });
});
