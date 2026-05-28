// tests/integration/usability.test.js
import request from 'supertest';
import * as dbHandler from '../dbHandler.js';

// Chặn database thật và mock Redis
jest.mock('../../src/core/config/database.js', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});
jest.mock('ioredis');

import app from '../../src/app.js';

describe('Usability Test: User Onboarding Flow (TC-U01)', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  test('TC-U01: Luồng người dùng Onboarding hoàn chỉnh (Đăng ký -> Đăng nhập -> Cập nhật hồ sơ -> Lấy thông tin Dashboard)', async () => {
    const mockUserPayload = {
      email: 'onboard_usability@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Onboarding User',
      country: 'Vietnam'
    };

    const startTime = Date.now();

    // 1. Bước đăng ký tài khoản mới
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(mockUserPayload);

    expect(regRes.status).toBe(201);
    expect(regRes.body).toHaveProperty('token');
    const token = regRes.body.token;

    // 2. Bước đăng nhập tài khoản
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: mockUserPayload.email,
        password: mockUserPayload.password
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');

    // 3. Bước cập nhật hồ sơ cá nhân (Onboarding Profile Setup)
    const updateRes = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profile: {
          fullName: 'Onboarding User Updated',
          country: 'Japan',
          bio: 'I want to exchange English and Japanese!',
          nativeLanguages: ['vi'],
          targetLanguages: ['ja']
        },
        settings: {
          uiLanguage: 'ja',
          theme: 'dark'
        }
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user.profile.fullName).toBe('Onboarding User Updated');
    expect(updateRes.body.user.profile.country).toBe('Japan');
    expect(updateRes.body.user.settings.theme).toBe('dark');

    // 4. Bước lấy thông tin Dashboard để bắt đầu sử dụng app
    const dashRes = await request(app)
      .get('/api/users/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body).toHaveProperty('greeting');
    expect(dashRes.body.stats.streak).toBe(0);

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    console.log(`⏱️ [Usability] Toàn bộ luồng Onboarding hoàn thành trong: ${durationMs} ms`);

    // Theo yêu cầu đặc tả TC-U01, 80% người dùng thực tế hoàn tất trong < 3 phút (180,000ms).
    // Ở môi trường API Backend, toàn bộ luồng xử lý code chỉ diễn ra trong vài trăm ms.
    expect(durationMs).toBeLessThan(180000); 
  });
});
