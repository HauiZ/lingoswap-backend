// tests/integration/auth_flow.test.js
import request from 'supertest';
import * as dbHandler from '../dbHandler.js';
import OTP from '../../src/modules/auth/OTP.js';

// 1. Chặn app.js tự kết nối database thật bằng cách mock connectDB
jest.mock('../../src/core/config/database.js', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});
jest.mock('ioredis');
jest.mock('../../src/core/utils/sendEmail.js', () => {
  return jest.fn().mockResolvedValue(true);
});

// Import app sau khi đã thiết lập các mocks cần thiết
import app from '../../src/app.js';

describe('Integration Test: Authentication Flow', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  const mockUser = {
    email: 'integration_auth@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    fullName: 'Integration User',
    country: 'Vietnam'
  };

  describe('Luồng Đăng ký & Đăng nhập', () => {
    test('POST /api/auth/register & POST /api/auth/login: Nên hoàn tất chuỗi Đăng ký -> Đăng nhập -> Lấy Token thành công', async () => {
      // 1. Đăng ký tài khoản mới
      const regRes = await request(app)
        .post('/api/auth/register')
        .send(mockUser);

      expect(regRes.status).toBe(201);
      expect(regRes.body).toHaveProperty('token');
      expect(regRes.body.email).toBe(mockUser.email.toLowerCase());

      // 2. Đăng nhập với mật khẩu đúng
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.headers['set-cookie']).toBeDefined();
      expect(loginRes.headers['set-cookie'][0]).toContain('refreshToken');
      expect(loginRes.body.email).toBe(mockUser.email.toLowerCase());
    });

    test('POST /api/auth/register: Nên chặn đăng ký trùng email', async () => {
      // Đăng ký lần 1
      await request(app).post('/api/auth/register').send(mockUser);

      // Đăng ký lần 2 trùng email
      const regRes2 = await request(app).post('/api/auth/register').send(mockUser);
      expect(regRes2.status).toBe(400);
      expect(regRes2.body).toHaveProperty('error');
      expect(regRes2.body.error).toBe('Email đã được sử dụng');
    });
  });

  describe('Luồng Bảo mật tài khoản (Token cần thiết)', () => {
    let accessToken;

    beforeEach(async () => {
      // Đăng ký và Đăng nhập để lấy Access Token
      await request(app).post('/api/auth/register').send(mockUser);
      const loginRes = await request(app).post('/api/auth/login').send({
        email: mockUser.email,
        password: mockUser.password
      });
      accessToken = loginRes.body.token;
    });

    test('PATCH /api/auth/password: Nên đổi mật khẩu thành công khi có Token hợp lệ', async () => {
      const changeRes = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: mockUser.password,
          newPassword: 'NewSecurePassword123!'
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.message).toBe('Đổi mật khẩu thành công');

      // Đăng nhập lại với mật khẩu mới để xác nhận
      const loginResNew = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'NewSecurePassword123!'
        });
      expect(loginResNew.status).toBe(200);
    });

    test('PATCH /api/auth/password: Nên chặn truy cập đổi mật khẩu khi thiếu Token', async () => {
      const changeRes = await request(app)
        .patch('/api/auth/password')
        .send({
          currentPassword: mockUser.password,
          newPassword: 'NewSecurePassword123!'
        });

      expect(changeRes.status).toBe(401);
    });
  });

  describe('Luồng Khôi phục mật khẩu (Forgot/Reset Password)', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(mockUser);
    });

    test('POST /api/auth/password/forgot & POST /api/auth/password/reset: Nên gửi OTP và khôi phục mật khẩu thành công', async () => {
      // 1. Quên mật khẩu
      const forgotRes = await request(app)
        .post('/api/auth/password/forgot')
        .send({ email: mockUser.email });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.message).toContain('Email đã được gửi');

      // Lấy OTP từ Database RAM
      const otpRecord = await OTP.findOne({ email: mockUser.email.toLowerCase() });
      expect(otpRecord).toBeDefined();

      // 2. Reset mật khẩu
      const resetRes = await request(app)
        .post('/api/auth/password/reset')
        .send({
          email: mockUser.email,
          otp: otpRecord.otpCode,
          newPassword: 'ResetPassword123!'
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toBe('Đặt lại mật khẩu thành công');

      // 3. Đăng nhập lại để xác thực mật khẩu mới
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'ResetPassword123!'
        });
      expect(loginRes.status).toBe(200);
    });
  });
});
