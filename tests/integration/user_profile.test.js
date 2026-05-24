// tests/integration/user_profile.test.js
import request from 'supertest';
import * as dbHandler from '../dbHandler.js';

// Mock DB connection, Redis và Middleware Upload
jest.mock('../../src/core/config/database.js', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});
jest.mock('ioredis');
jest.mock('../../src/core/middlewares/upload.js', () => {
  const mockSingle = () => (req, res, next) => {
    req.file = { path: 'https://res.cloudinary.com/mock-cloud/image/upload/v123/mock-avatar.png' };
    next();
  };
  return {
    uploadImage: { single: mockSingle },
    uploadChatImage: { single: mockSingle }
  };
});

import app from '../../src/app.js';

describe('Integration Test: User Profile API', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let accessToken, userId;
  const mockUser = {
    email: 'profile_test@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    fullName: 'Nguyen Profile',
    country: 'Vietnam'
  };

  beforeEach(async () => {
    // 1. Đăng ký & Đăng nhập lấy Token
    await request(app).post('/api/auth/register').send(mockUser);
    const loginRes = await request(app).post('/api/auth/login').send({
      email: mockUser.email,
      password: mockUser.password
    });
    accessToken = loginRes.body.token;
    userId = loginRes.body.id;
  });

  test('GET /api/users/me: Nên lấy thông tin profile của chính mình', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', mockUser.email.toLowerCase());
    expect(res.body.profile.fullName).toBe(mockUser.fullName);
    expect(res.body).toHaveProperty('greeting');
  });

  test('GET /api/users/dashboard: Nên lấy thông tin tổng quan Dashboard', async () => {
    const res = await request(app)
      .get('/api/users/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('greeting');
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats.streak).toBe(0);
  });

  test('PUT /api/users/me: Nên cập nhật thông tin profile thành công', async () => {
    const updatePayload = {
      profile: {
        fullName: 'Nguyen Profile Edited',
        country: 'Japan',
        bio: 'Hello, I want to learn Japanese!'
      },
      settings: {
        theme: 'dark'
      }
    };

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.user.profile.fullName).toBe(updatePayload.profile.fullName);
    expect(res.body.user.profile.country).toBe(updatePayload.profile.country);
    expect(res.body.user.profile.bio).toBe(updatePayload.profile.bio);
    expect(res.body.user.settings.theme).toBe(updatePayload.settings.theme);
  });

  test('PUT /api/users/me/avatar: Nên upload avatar (mock upload) thành công', async () => {
    const res = await request(app)
      .put('/api/users/me/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      // Ta truyền bất kỳ file nào vì middleware đã được mock trả về URL cố định
      .attach('avatar', Buffer.from('mock-file-content'), 'avatar.png');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('avatarUrl');
    expect(res.body.avatarUrl).toBe('https://res.cloudinary.com/mock-cloud/image/upload/v123/mock-avatar.png');

    // Kiểm tra DB xem avatar đã cập nhật chưa
    const profileRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(profileRes.body.profile.avatar).toBe('https://res.cloudinary.com/mock-cloud/image/upload/v123/mock-avatar.png');
  });

  test('GET /api/users/:id: Nên lấy public profile của người khác mà không cần authentication', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.fullName).toBe(mockUser.fullName);
    expect(res.body.profile.country).toBe(mockUser.country);
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('settings');
  });

  test('GET /api/users: Nên tìm kiếm được người dùng', async () => {
    // Đăng ký một user khác để tìm kiếm (vì API search loại trừ chính mình)
    await request(app).post('/api/auth/register').send({
      email: 'another_user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Nguyen Another',
      country: 'Vietnam'
    });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ q: 'Another' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0].fullName).toBe('Nguyen Another');
  });
});
