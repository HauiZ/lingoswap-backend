// tests/integration/blacklist_keyword.test.js
import request from 'supertest';
import * as dbHandler from '../dbHandler.js';
import User from '../../src/modules/users/User.js';
import BlacklistKeyword from '../../src/modules/admin/BlacklistKeyword.js';
import * as chatService from '../../src/modules/chat/chat.service.js';

// Mock DB connection và Redis
jest.mock('../../src/core/config/database.js', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});
jest.mock('ioredis');

import app from '../../src/app.js';

describe('Integration Test: Blacklist Keyword API & Chat Moderation', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let adminToken, userToken, adminId, userId, partnerId;

  beforeEach(async () => {
    // 1. Đăng ký & Đăng nhập Admin
    await request(app).post('/api/auth/register').send({
      email: 'admin@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'System Admin',
      country: 'Vietnam'
    });
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    adminUser.role = 'admin';
    await adminUser.save();
    adminId = adminUser._id;

    const adminLog = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!'
    });
    adminToken = adminLog.body.token;

    // 2. Đăng ký & Đăng nhập User thông thường B
    await request(app).post('/api/auth/register').send({
      email: 'userb@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Regular User B',
      country: 'Vietnam'
    });
    const userLog = await request(app).post('/api/auth/login').send({
      email: 'userb@example.com',
      password: 'Password123!'
    });
    userToken = userLog.body.token;
    userId = userLog.body.id;

    // 3. Đăng ký User C (đối tác chat)
    await request(app).post('/api/auth/register').send({
      email: 'userc@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Regular User C',
      country: 'Japan'
    });
    const partnerUser = await User.findOne({ email: 'userc@example.com' });
    partnerId = partnerUser._id;
  });

  test('Luồng Admin CRUD Blacklist Keywords: Thêm -> Trùng lặp -> Danh sách -> Xóa -> Chặn người dùng thường', async () => {
    // 1. Thêm từ khóa cấm thành công
    const addRes = await request(app)
      .post('/api/admin/blacklist-keywords')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ keyword: '  Quấy Rối  ' }); // Cố tình thêm khoảng trắng và chữ hoa

    expect(addRes.status).toBe(201);
    expect(addRes.body.message).toBe('Đã thêm từ khóa cấm thành công');
    expect(addRes.body.keyword.keyword).toBe('quấy rối'); // Đã trim và lowercase

    // 2. Ngăn chặn thêm trùng lặp
    const duplicateRes = await request(app)
      .post('/api/admin/blacklist-keywords')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ keyword: 'quấy rối' });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.error).toBe('Từ khóa này đã tồn tại trong danh sách cấm');

    // 3. Lấy danh sách từ khóa cấm
    const listRes = await request(app)
      .get('/api/admin/blacklist-keywords')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'quấy' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBe(1);
    expect(listRes.body.keywords[0].keyword).toBe('quấy rối');

    // 4. Cản trở người dùng thường CRUD blacklist keywords
    const normalUserPostRes = await request(app)
      .post('/api/admin/blacklist-keywords')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ keyword: 'hacker' });

    expect(normalUserPostRes.status).toBe(403);
    expect(normalUserPostRes.body.error).toBe('Dữ liệu bị cấm: Quyền hạn không đủ');

    // 5. Xóa từ khóa cấm thành công
    const keywordId = addRes.body.keyword._id;
    const deleteRes = await request(app)
      .delete(`/api/admin/blacklist-keywords/${keywordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe('Đã xóa từ khóa cấm thành công');

    // Kiểm tra đã xóa trong DB
    const findDeleted = await BlacklistKeyword.findById(keywordId);
    expect(findDeleted).toBeNull();
  });

  test('Kiểm duyệt Chat Moderation: Chặn tin nhắn chứa từ khóa cấm, cho phép tin nhắn sạch', async () => {
    // 1. Admin thêm từ khóa cấm "phản động" và "spam"
    await request(app)
      .post('/api/admin/blacklist-keywords')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ keyword: 'phản động' });

    await request(app)
      .post('/api/admin/blacklist-keywords')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ keyword: 'spam' });

    // 2. Gửi tin nhắn sạch -> Lưu thành công
    const cleanMsg = await chatService.saveMessageService({
      senderId: userId,
      partnerId: partnerId,
      content: 'Chào bạn, chúc bạn một ngày tốt lành!',
      matchSessionId: null,
      type: 'text'
    });
    expect(cleanMsg.newMessage).toBeDefined();
    expect(cleanMsg.newMessage.content).toBe('Chào bạn, chúc bạn một ngày tốt lành!');

    // 3. Gửi tin nhắn chứa từ cấm "phản động" -> Bị ném lỗi
    await expect(
      chatService.saveMessageService({
        senderId: userId,
        partnerId: partnerId,
        content: 'Nội dung này chứa từ PHẢN ĐỘNG!', // Có chữ hoa
        matchSessionId: null,
        type: 'text'
      })
    ).rejects.toThrow('Tin nhắn chứa từ ngữ không phù hợp');

    // 4. Gửi tin nhắn chứa từ cấm "spam" -> Bị ném lỗi
    await expect(
      chatService.saveMessageService({
        senderId: userId,
        partnerId: partnerId,
        content: 'spam bot active',
        matchSessionId: null,
        type: 'text'
      })
    ).rejects.toThrow('Tin nhắn chứa từ ngữ không phù hợp');
  });
});
