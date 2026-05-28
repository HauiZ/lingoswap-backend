// tests/unit/chat.service.test.js
import * as dbHandler from '../dbHandler.js';
import * as chatService from '../../src/modules/chat/services/chat.service.js';
import authService from '../../src/modules/auth/services/auth.service.js';
import Conversation from '../../src/modules/chat/entities/Conversation.js';
import Message from '../../src/modules/chat/entities/Message.js';

jest.mock('ioredis');

describe('Unit Test: Chat Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let userA, userB;

  beforeEach(async () => {
    userA = await authService.register({
      email: 'chata@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Chat User A',
      country: 'Vietnam'
    });

    userB = await authService.register({
      email: 'chatb@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Chat User B',
      country: 'Japan'
    });
  });

  describe('saveMessageService()', () => {
    test('Nên tự động tạo Conversation mới và lưu tin nhắn text khi nhắn tin lần đầu', async () => {
      const res = await chatService.saveMessageService({
        senderId: userA._id,
        partnerId: userB._id,
        content: 'Hello friend!'
      });

      expect(res.newMessage).toBeDefined();
      expect(res.newMessage.content).toBe('Hello friend!');
      expect(res.newMessage.senderId.toString()).toBe(userA._id.toString());
      expect(res.messageData.conversationId).toBeDefined();

      // Kiểm tra cuộc hội thoại
      const conversation = await Conversation.findById(res.messageData.conversationId);
      expect(conversation).toBeDefined();
      expect(conversation.isPermanent).toBe(true); // Permanent vì không phải matchSession
      expect(conversation.participants.map(p => p.toString())).toContain(userA._id.toString());
      expect(conversation.participants.map(p => p.toString())).toContain(userB._id.toString());
      expect(conversation.lastMessage.toString()).toBe(res.newMessage._id.toString());
    });

    test('Nên dùng lại cuộc hội thoại cũ khi gửi tin nhắn tiếp theo', async () => {
      // Nhắn tin lần 1
      const res1 = await chatService.saveMessageService({
        senderId: userA._id,
        partnerId: userB._id,
        content: 'Msg 1'
      });

      // Nhắn tin lần 2
      const res2 = await chatService.saveMessageService({
        senderId: userB._id,
        partnerId: userA._id,
        content: 'Msg 2'
      });

      expect(res2.messageData.conversationId.toString()).toBe(res1.messageData.conversationId.toString());

      const conversation = await Conversation.findById(res2.messageData.conversationId);
      expect(conversation.lastMessage.toString()).toBe(res2.newMessage._id.toString());
    });

    test('Nên tạo cuộc hội thoại tạm thời (không permanent) khi nhắn trong phiên ghép cặp', async () => {
      const mockMatchSessionId = '507f1f77bcf86cd799439011';
      const res = await chatService.saveMessageService({
        senderId: userA._id,
        partnerId: userB._id,
        content: 'Hello in call!',
        matchSessionId: mockMatchSessionId
      });

      const conversation = await Conversation.findById(res.messageData.conversationId);
      expect(conversation.isPermanent).toBe(false);
      expect(conversation.matchSessionId.toString()).toBe(mockMatchSessionId);
    });
  });

  describe('saveImageMessageService()', () => {
    test('Nên tạo tin nhắn hình ảnh thành công', async () => {
      const res = await chatService.saveImageMessageService({
        senderId: userA._id,
        partnerId: userB._id,
        imageUrl: 'https://res.cloudinary.com/mock-cloud/image/upload/chat.png'
      });

      expect(res.newMessage).toBeDefined();
      expect(res.newMessage.type).toBe('image');
      expect(res.newMessage.content).toBe('https://res.cloudinary.com/mock-cloud/image/upload/chat.png');
    });
  });
});
