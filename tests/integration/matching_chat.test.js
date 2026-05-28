// tests/integration/matching_chat.test.js
import request from 'supertest';
import * as dbHandler from '../dbHandler.js';
import * as matchService from '../../src/modules/match/services/match.service.js';
import * as chatService from '../../src/modules/chat/services/chat.service.js';
import MatchSession from '../../src/modules/match/entities/MatchSession.js';

// Mock DB connection, Redis và Multer Image Chat
jest.mock('../../src/core/config/database.js', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});
jest.mock('ioredis');
jest.mock('../../src/core/middlewares/upload.js', () => {
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() });
  const mockSingle = (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) return next(err);
      if (req.file) {
        req.file.path = 'https://res.cloudinary.com/mock-cloud/image/upload/v123/chat-image.png';
      }
      next();
    });
  };
  return {
    uploadImage: { single: mockSingle },
    uploadChatImage: { single: mockSingle }
  };
});

import app from '../../src/app.js';

describe('Integration Test: Matching & Chat API', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let tokenA, tokenB, idA, idB;

  beforeEach(async () => {
    // 1. Đăng ký & Đăng nhập User A
    await request(app).post('/api/auth/register').send({
      email: 'match_usera@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User A Match',
      country: 'Vietnam'
    });
    const logA = await request(app).post('/api/auth/login').send({
      email: 'match_usera@example.com',
      password: 'Password123!'
    });
    tokenA = logA.body.token;
    idA = logA.body.id;

    // 2. Đăng ký & Đăng nhập User B
    await request(app).post('/api/auth/register').send({
      email: 'match_userb@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'User B Match',
      country: 'Japan'
    });
    const logB = await request(app).post('/api/auth/login').send({
      email: 'match_userb@example.com',
      password: 'Password123!'
    });
    tokenB = logB.body.token;
    idB = logB.body.id;
  });

  test('Luồng Ghép Cặp & Chat (GET /conversations, GET /conversations/:id, POST /conversations/images, GET /matches, GET /matches/:id, POST /matches/:id/reviews): Nên hoàn thành luồng tích hợp: Ghép cặp -> Chat text/image -> Xem lịch sử cuộc gọi -> Rời phòng -> Review đối tác', async () => {
    // Bước 1: Kích hoạt ghép cặp thông qua Service (do Socket.io giả lập trong môi trường test)
    await matchService.findOrQueuePartnerService(idA, 'english');
    const matchRes = await matchService.findOrQueuePartnerService(idB, 'english');
    
    expect(matchRes.status).toBe('match_found');
    const sessionId = matchRes.sessionId;

    // Bước 2: Giả lập gửi tin nhắn text trong cuộc gọi thông qua Chat Service
    const msgRes = await chatService.saveMessageService({
      senderId: idA,
      partnerId: idB,
      content: 'Hi! Nice to meet you in LingoSwap!',
      matchSessionId: sessionId
    });
    expect(msgRes.newMessage).toBeDefined();
    const conversationId = msgRes.messageData.conversationId;

    // Giả lập thêm một tin nhắn ngoài cuộc gọi (permanent) để xuất hiện trong list chat chính
    await chatService.saveMessageService({
      senderId: idA,
      partnerId: idB,
      content: 'Hello, let us swap languages!',
      matchSessionId: null
    });

    // Bước 3: Lấy danh sách các cuộc trò chuyện qua API HTTP
    const convRes = await request(app)
      .get('/api/user/conversations')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(convRes.status).toBe(200);
    expect(convRes.body.length).toBeGreaterThan(0);

    // Bước 4: Lấy tin nhắn chi tiết trong cuộc trò chuyện qua API HTTP
    const msgListRes = await request(app)
      .get(`/api/user/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(msgListRes.status).toBe(200);
    expect(msgListRes.body.length).toBe(1);
    expect(msgListRes.body[0].content).toBe('Hi! Nice to meet you in LingoSwap!');

    // Bước 5: Gửi tin nhắn hình ảnh qua API HTTP (Sử dụng multer mock)
    const imgRes = await request(app)
      .post('/api/user/conversations/images')
      .set('Authorization', `Bearer ${tokenA}`)
      .field('partnerId', idB.toString())
      .attach('image', Buffer.from('mock-img'), 'image.png');

    expect(imgRes.status).toBe(201);
    expect(imgRes.body).toHaveProperty('content');
    expect(imgRes.body.content).toBe('https://res.cloudinary.com/mock-cloud/image/upload/v123/chat-image.png');

    // Bước 8: Kết thúc cuộc gọi qua Service và cập nhật duration để cho phép Lịch sử và Review hiển thị
    await matchService.leaveMatchAndQueueService(idA, 'english');
    await MatchSession.findByIdAndUpdate(sessionId, {
      startedAt: new Date(Date.now() - 60000), // lùi 1 phút
      endedAt: new Date(),
      status: 'completed',
      durationSeconds: 60
    });

    // Bước 6: Lấy danh sách lịch sử Matching qua API HTTP
    const historyRes = await request(app)
      .get('/api/user/matches')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.length).toBe(1);
    expect(historyRes.body[0]._id.toString()).toBe(sessionId.toString());

    // Bước 7: Lấy chi tiết phiên gọi bao gồm tin nhắn qua API HTTP
    const detailRes = await request(app)
      .get(`/api/user/matches/${sessionId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body._id.toString()).toBe(sessionId.toString());
    expect(detailRes.body.messages.length).toBeGreaterThan(0);

    // Bước 9: Tạo Review đánh giá đối tác sau cuộc gọi qua API HTTP
    const reviewRes = await request(app)
      .post(`/api/user/matches/${sessionId}/reviews`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        rating: 5,
        comment: 'Great learning partner!'
      });

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.message).toBe('Đánh giá phiên gọi thành công');
  });
});
