// tests/integration/socket_handlers.test.js
import * as dbHandler from '../dbHandler.js';
import { handleMatchProvider } from '../../src/modules/match/controllers/matchHandler.js';
import User from '../../src/modules/users/entities/User.js';
import MatchSession from '../../src/modules/match/entities/MatchSession.js';
import redis from '../../src/core/config/redis.js';
import { redisStore, listStore } from '../__mocks__/ioredis.js';

jest.mock('ioredis');

describe('Integration Test: Socket.io Match Handlers', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => {
    await dbHandler.clear();
    for (const key in redisStore) delete redisStore[key];
    for (const key in listStore) delete listStore[key];
  });
  afterAll(async () => await dbHandler.close());

  let ioMock, socketA, socketB, userA, userB;

  beforeEach(async () => {
    userA = await User.create({
      email: 'usera_socket@example.com',
      password: 'Password123!',
      profile: { fullName: 'User A Socket', country: 'vi' }
    });

    userB = await User.create({
      email: 'userb_socket@example.com',
      password: 'Password123!',
      profile: { fullName: 'User B Socket', country: 'vi' }
    });

    // Mock Socket.io Server instance
    ioMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map()
      }
    };

    // Mock Socket Client A
    socketA = {
      id: 'socket_a_id',
      user: userA,
      currentLanguage: null,
      rooms: new Set(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      join: jest.fn(function(room) { this.rooms.add(room); }),
      on: jest.fn()
    };

    // Mock Socket Client B
    socketB = {
      id: 'socket_b_id',
      user: userB,
      currentLanguage: null,
      rooms: new Set(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      join: jest.fn(function(room) { this.rooms.add(room); }),
      on: jest.fn()
    };

    // Register active sockets in redis and io sockets map
    await redis.set(`socket:${userA._id}`, 'socket_a_id');
    await redis.set(`socket:${userB._id}`, 'socket_b_id');
    ioMock.sockets.sockets.set('socket_a_id', socketA);
    ioMock.sockets.sockets.set('socket_b_id', socketB);
  });

  test('Luồng Socket join_queue và Ghép Cặp Thành Công: 2 Socket clients join cùng ngôn ngữ', async () => {
    // Đăng ký event handlers cho Socket A và Socket B
    const handlersA = {};
    const handlersB = {};
    socketA.on.mockImplementation((event, cb) => { handlersA[event] = cb; });
    socketB.on.mockImplementation((event, cb) => { handlersB[event] = cb; });

    handleMatchProvider(ioMock, socketA);
    handleMatchProvider(ioMock, socketB);

    // 1. Socket A tham gia hàng chờ trước
    await handlersA['join_queue']({ language: 'english' });
    expect(socketA.emit).toHaveBeenCalledWith('waiting_status', { message: 'Đang tìm kiếm đối thủ...' });

    // 2. Socket B tham gia hàng chờ
    await handlersB['join_queue']({ language: 'english' });

    // 3. Xác minh cả hai Socket đều join vào một Room ID (Session ID) và được thông báo
    expect(socketA.join).toHaveBeenCalled();
    expect(socketB.join).toHaveBeenCalled();

    const ongoingSession = await MatchSession.findOne({ participants: userA._id, status: 'ongoing' });
    expect(ongoingSession).toBeDefined();

    // Xác minh io gửi tin nhắn match_found cho cả hai
    expect(ioMock.to).toHaveBeenCalledWith('socket_a_id');
    expect(ioMock.to).toHaveBeenCalledWith('socket_b_id');
    expect(ioMock.emit).toHaveBeenCalledWith('match_found', expect.objectContaining({
      sessionId: ongoingSession._id.toString()
    }));
  });

  test('Luồng Socket leave_queue và partner_disconnected', async () => {
    const handlersA = {};
    socketA.on.mockImplementation((event, cb) => { handlersA[event] = cb; });

    handleMatchProvider(ioMock, socketA);

    // Cho A join queue và tạo một session ongoing giả lập
    const session = await MatchSession.create({
      participants: [userA._id, userB._id],
      language: 'english',
      status: 'ongoing',
      startedAt: new Date()
    });

    // Gọi leave_queue
    await handlersA['leave_queue']();

    // Xác minh session được hoàn thành và partner (B) nhận thông báo ngắt kết nối
    const updated = await MatchSession.findById(session._id);
    expect(updated.status).toBe('completed');
    expect(ioMock.to).toHaveBeenCalledWith('socket_b_id');
    expect(ioMock.emit).toHaveBeenCalledWith('partner_disconnected', {
      message: 'Đối tác đã rời cuộc trò chuyện.'
    });
  });

  test('Luồng Socket direct_match_request và direct_match_response (Đồng ý)', async () => {
    const handlersA = {};
    const handlersB = {};
    socketA.on.mockImplementation((event, cb) => { handlersA[event] = cb; });
    socketB.on.mockImplementation((event, cb) => { handlersB[event] = cb; });

    handleMatchProvider(ioMock, socketA);
    handleMatchProvider(ioMock, socketB);

    // 1. User A gọi trực tiếp User B
    await handlersA['direct_match_request']({ targetUserId: userB._id.toString() });
    
    // User B nhận lời mời
    expect(ioMock.to).toHaveBeenCalledWith('socket_b_id');
    expect(ioMock.emit).toHaveBeenCalledWith('direct_match_offer', {
      callerId: userA._id.toString(),
      message: 'Bạn có một cuộc gọi đến.'
    });

    // 2. User B chấp nhận cuộc gọi
    await handlersB['direct_match_response']({ callerId: userA._id.toString(), accept: true });

    // Cả hai cùng join vào Room và nhận match_found
    expect(socketA.join).toHaveBeenCalled();
    expect(socketB.join).toHaveBeenCalled();
    expect(ioMock.to).toHaveBeenCalledWith('socket_a_id');
    expect(ioMock.to).toHaveBeenCalledWith('socket_b_id');
  });

  test('Luồng WebRTC Signaling Forwarding: Forward tín hiệu offer, answer, ice_candidate đến peer', async () => {
    const handlersA = {};
    socketA.on.mockImplementation((event, cb) => { handlersA[event] = cb; });

    handleMatchProvider(ioMock, socketA);

    const mockSessionId = '507f1f77bcf86cd799439011';

    // A gửi webrtc_offer -> forward tới room
    await handlersA['webrtc_offer']({ sessionId: mockSessionId, offer: 'mock_offer' });
    expect(socketA.to).toHaveBeenCalledWith(mockSessionId);
    expect(socketA.emit).toHaveBeenCalledWith('webrtc_offer', { offer: 'mock_offer' });

    // A gửi webrtc_answer -> forward tới room
    await handlersA['webrtc_answer']({ sessionId: mockSessionId, answer: 'mock_answer' });
    expect(socketA.to).toHaveBeenCalledWith(mockSessionId);
    expect(socketA.emit).toHaveBeenCalledWith('webrtc_answer', { answer: 'mock_answer' });

    // A gửi webrtc_ice_candidate -> forward tới room
    await handlersA['webrtc_ice_candidate']({ sessionId: mockSessionId, candidate: 'mock_candidate' });
    expect(socketA.to).toHaveBeenCalledWith(mockSessionId);
    expect(socketA.emit).toHaveBeenCalledWith('webrtc_ice_candidate', { candidate: 'mock_candidate' });
  });
});
