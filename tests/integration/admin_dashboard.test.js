// tests/integration/admin_dashboard.test.js
import request from 'supertest';
import * as dbHandler from '../dbHandler.js';
import User from '../../src/modules/users/entities/User.js';
import Appeal from '../../src/modules/users/entities/Appeal.js';

// Mock DB connection và Redis
jest.mock('../../src/core/config/database.js', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});
jest.mock('ioredis');

import app from '../../src/app.js';

describe('Integration Test: Admin Dashboard API', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let adminToken, userToken, adminId, userId;

  beforeEach(async () => {
    // 1. Tạo tài khoản Admin A
    await request(app).post('/api/auth/register').send({
      email: 'admin@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Super Admin',
      country: 'Vietnam'
    });
    
    // Nâng cấp vai trò admin trong DB
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    adminUser.role = 'admin';
    await adminUser.save();
    adminId = adminUser._id;

    // Đăng nhập Admin để lấy Token có quyền Admin
    const adminLog = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!'
    });
    adminToken = adminLog.body.token;

    // 2. Tạo tài khoản Thường B
    await request(app).post('/api/auth/register').send({
      email: 'userb_normal@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User Normal B',
      country: 'Vietnam'
    });
    const userLog = await request(app).post('/api/auth/login').send({
      email: 'userb_normal@example.com',
      password: 'Password123!'
    });
    userToken = userLog.body.token;
    userId = userLog.body.id;
  });

  test('Luồng Admin Dashboard (GET /admin/dashboard, GET /admin/users, PATCH /users/:id/status, GET /admin/appeals, PATCH /appeals/:id/status): Nên chạy hoàn tất luồng quản trị viên: Quản trị -> Khóa User -> Chặn Đăng nhập -> Kháng cáo -> Phê duyệt mở khóa', async () => {
    // Bước 1: Admin lấy thông tin Dashboard tổng quan
    const dashRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(dashRes.status).toBe(200);
    expect(dashRes.body).toHaveProperty('users');

    // Bước 2: Admin lấy danh sách User
    const usersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(usersRes.status).toBe(200);
    expect(usersRes.body.length).toBe(2); // gồm Admin và User B

    // Bước 3: Admin Khóa (Ban) tài khoản User B
    const banRes = await request(app)
      .patch(`/api/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(banRes.status).toBe(200);
    expect(banRes.body.message).toBe('Đã khóa tài khoản người dùng do vi phạm');

    // Bước 4: Kiểm tra User B bị khóa, không thể đăng nhập
    const loginFail = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'userb_normal@example.com',
        password: 'Password123!'
      });

    expect(loginFail.status).toBe(403);
    expect(loginFail.body.error).toBe('Tài khoản đã bị khóa');

    // Bước 5: Giả lập User B gửi đơn kháng cáo trực tiếp trong DB (do token kháng cáo verify qua JWT riêng biệt)
    const appeal = await Appeal.create({
      userId: userId,
      reason: 'I was wrongly banned by a false report.'
    });
    expect(appeal).toBeDefined();

    // Bước 6: Admin lấy danh sách đơn kháng cáo
    const appealsRes = await request(app)
      .get('/api/admin/appeals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(appealsRes.status).toBe(200);
    expect(appealsRes.body.length).toBe(1);
    expect(appealsRes.body[0].reason).toBe('I was wrongly banned by a false report.');

    // Bước 7: Admin phê duyệt đơn kháng cáo (Unban User B)
    const resolveRes = await request(app)
      .patch(`/api/admin/appeals/${appeal._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'approved',
        adminNotes: 'Apology accepted. Unbanning user.'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.message).toBe('Đã cập nhật trạng thái đơn kháng cáo');

    // Bước 8: Kiểm tra User B đã có thể đăng nhập bình thường
    const loginSuccess = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'userb_normal@example.com',
        password: 'Password123!'
      });

    expect(loginSuccess.status).toBe(200);
    expect(loginSuccess.body).toHaveProperty('token');
  }, 30000);

  test('BE71 / BE114: Nên trả về 403 khi tài khoản không phải Admin cố gắng truy cập API Admin', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Dữ liệu bị cấm: Quyền hạn không đủ');
  });

  test('BE109: Nên trả về 404 khi Admin cố gắng xóa một người dùng không tồn tại', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .delete(`/api/admin/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Người dùng không tồn tại');
  });
});
