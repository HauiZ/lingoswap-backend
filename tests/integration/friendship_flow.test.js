// tests/integration/friendship_flow.test.js
import request from 'supertest';
import * as dbHandler from '../dbHandler.js';

// Mock DB connection và Redis
jest.mock('../../src/core/config/database.js', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});
jest.mock('ioredis');

import app from '../../src/app.js';

describe('Integration Test: Friendship Flow API', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let tokenA, tokenB, idA, idB;

  beforeEach(async () => {
    // 1. Đăng ký và Đăng nhập User A
    await request(app).post('/api/auth/register').send({
      email: 'usera_integration@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User A Integration',
      country: 'Vietnam'
    });
    const logA = await request(app).post('/api/auth/login').send({
      email: 'usera_integration@example.com',
      password: 'Password123!'
    });
    tokenA = logA.body.token;
    idA = logA.body.id;

    // 2. Đăng ký và Đăng nhập User B
    await request(app).post('/api/auth/register').send({
      email: 'userb_integration@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User B Integration',
      country: 'Vietnam'
    });
    const logB = await request(app).post('/api/auth/login').send({
      email: 'userb_integration@example.com',
      password: 'Password123!'
    });
    tokenB = logB.body.token;
    idB = logB.body.id;
  });

  test('Luồng Bạn bè (GET /status, POST /requests, GET /requests, PATCH /requests/:requestId, GET /, DELETE /): Nên chạy hoàn chỉnh luồng bạn bè: Kiểm tra -> Gửi yêu cầu -> Nhận -> Đồng ý -> Hủy bạn', async () => {
    // Bước 1: Kiểm tra trạng thái bạn bè ban đầu (none)
    const initStatus = await request(app)
      .get(`/api/user/friends/${idB}/status`)
      .set('Authorization', `Bearer ${tokenA}`);
    
    expect(initStatus.status).toBe(200);
    expect(initStatus.body.status).toBe('none');

    // Bước 2: User A gửi yêu cầu kết bạn tới User B
    const sendReq = await request(app)
      .post(`/api/user/friends/${idB}/requests`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(sendReq.status).toBe(201);
    expect(sendReq.body.message).toBe('Đã gửi yêu cầu kết bạn');

    // Bước 3: Kiểm tra trạng thái bạn bè đã thay đổi
    const statusA = await request(app)
      .get(`/api/user/friends/${idB}/status`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(statusA.body.status).toBe('request_sent');

    const statusB = await request(app)
      .get(`/api/user/friends/${idA}/status`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(statusB.body.status).toBe('request_received');

    // Bước 4: User B lấy danh sách lời mời chờ duyệt
    const reqList = await request(app)
      .get('/api/user/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`);
    
    expect(reqList.status).toBe(200);
    expect(reqList.body.length).toBe(1);
    expect(reqList.body[0].partner._id.toString()).toBe(idA.toString());
    const requestId = reqList.body[0]._id;

    // Bước 5: User B đồng ý kết bạn
    const acceptReq = await request(app)
      .patch(`/api/user/friends/requests/${requestId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'accept' });

    expect(acceptReq.status).toBe(200);
    expect(acceptReq.body.message).toBe('Đã chấp nhận yêu cầu kết bạn');

    // Bước 6: Kiểm tra cả 2 nằm trong danh sách bạn bè của nhau
    const friendsA = await request(app)
      .get('/api/user/friends')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(friendsA.status).toBe(200);
    expect(friendsA.body.length).toBe(1);
    expect(friendsA.body[0]._id.toString()).toBe(idB.toString());

    // Bước 7: User A hủy kết bạn với User B
    const removeFriend = await request(app)
      .delete(`/api/user/friends/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(removeFriend.status).toBe(200);
    expect(removeFriend.body.message).toBe('Đã hủy kết bạn');

    // Bước 8: Kiểm tra lại trạng thái bạn bè trở lại none
    const finalStatus = await request(app)
      .get(`/api/user/friends/${idB}/status`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(finalStatus.body.status).toBe('none');
  });

  test('BE99: Không thể tự gửi kết bạn cho chính mình', async () => {
    const res = await request(app)
      .post(`/api/user/friends/${idA}/requests`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Không thể gửi yêu cầu kết bạn cho chính mình');
  });

  test('BE100: Người lạ không được phép duyệt hộ lời mời kết bạn của người khác', async () => {
    // 1. User A gửi kết bạn cho User B
    await request(app)
      .post(`/api/user/friends/${idB}/requests`)
      .set('Authorization', `Bearer ${tokenA}`);

    // Nhận requestId
    const reqList = await request(app)
      .get('/api/user/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`);
    const requestId = reqList.body[0]._id;

    // 2. Đăng ký và Đăng nhập User C (Người lạ)
    await request(app).post('/api/auth/register').send({
      email: 'userc_integration@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User C Integration',
      country: 'Vietnam'
    });
    const logC = await request(app).post('/api/auth/login').send({
      email: 'userc_integration@example.com',
      password: 'Password123!'
    });
    const tokenC = logC.body.token;

    // 3. User C cố gắng duyệt lời mời này
    const res = await request(app)
      .patch(`/api/user/friends/requests/${requestId}`)
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ status: 'accept' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Không có quyền thực hiện hành động này');
  });
});
