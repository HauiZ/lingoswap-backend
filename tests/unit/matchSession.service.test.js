// tests/unit/matchSession.service.test.js
import * as dbHandler from '../dbHandler.js';
import matchSessionService from '../../src/modules/match/services/matchSession.service.js';
import User from '../../src/modules/users/entities/User.js';
import MatchSession from '../../src/modules/match/entities/MatchSession.js';
import UserReview from '../../src/modules/users/entities/UserReview.js';

jest.mock('ioredis');

describe('Unit Test: Match Session & Review Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  let userA, userB, userC, session;

  beforeEach(async () => {
    userA = await User.create({
      email: 'usera_review@example.com',
      password: 'Password123!',
      profile: { fullName: 'Reviewer A', country: 'vi' }
    });

    userB = await User.create({
      email: 'userb_review@example.com',
      password: 'Password123!',
      profile: { fullName: 'Reviewer B', country: 'vi' }
    });

    userC = await User.create({
      email: 'userc_review@example.com',
      password: 'Password123!',
      profile: { fullName: 'Reviewer C', country: 'vi' }
    });

    // Tạo cuộc gọi thành công đã kết thúc
    session = await MatchSession.create({
      participants: [userA._id, userB._id],
      language: 'english',
      status: 'completed',
      startedAt: new Date(Date.now() - 60 * 1000),
      endedAt: new Date(),
      durationSeconds: 60
    });
  });

  describe('createReview() - BE89 & BE90', () => {
    test('Nên gửi đánh giá đối tác thành công với rating hợp lệ', async () => {
      const payload = {
        rating: 5,
        comment: 'Tuyệt vời!'
      };

      const review = await matchSessionService.createReview(userA._id, session._id, payload);
      expect(review).toBeDefined();
      expect(review.reviewerId.toString()).toBe(userA._id.toString());
      expect(review.targetUserId.toString()).toBe(userB._id.toString());
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Tuyệt vời!');
    });

    test('BE89: Nên chặn gửi đánh giá trùng lặp cho cùng một phiên gọi', async () => {
      const payload = { rating: 4, comment: 'Tốt' };

      // Đánh giá lần 1
      await matchSessionService.createReview(userA._id, session._id, payload);

      // Đánh giá lần 2 trùng lặp -> Phải ném lỗi 400
      await expect(
        matchSessionService.createReview(userA._id, session._id, payload)
      ).rejects.toThrow('Bạn đã đánh giá phiên gọi này rồi.');
    });

    test('BE90: Nên chặn người không tham gia cuộc gọi thực hiện đánh giá', async () => {
      const payload = { rating: 5, comment: 'Hack đánh giá' };

      // User C không thuộc session -> Phải ném lỗi 403
      await expect(
        matchSessionService.createReview(userC._id, session._id, payload)
      ).rejects.toThrow('Bạn không có quyền đánh giá phiên gọi này.');
    });

    test('Nên chặn đánh giá số sao ngoài khoảng 1-5', async () => {
      await expect(
        matchSessionService.createReview(userA._id, session._id, { rating: 0, comment: 'Tệ' })
      ).rejects.toThrow('Đánh giá phải từ 1 đến 5 sao.');

      await expect(
        matchSessionService.createReview(userA._id, session._id, { rating: 6, comment: 'Quá tốt' })
      ).rejects.toThrow('Đánh giá phải từ 1 đến 5 sao.');
    });
  });

  describe('getMatchHistory() và getMatchSessionDetails()', () => {
    test('Nên lấy lịch sử cuộc gọi chính xác', async () => {
      const history = await matchSessionService.getMatchHistory(userA._id);
      expect(history.length).toBe(1);
      expect(history[0]._id.toString()).toBe(session._id.toString());
      expect(history[0].partner._id.toString()).toBe(userB._id.toString());
    });

    test('Nên lấy chi tiết cuộc gọi chính xác cho participant', async () => {
      const details = await matchSessionService.getMatchSessionDetails(session._id, userA._id);
      expect(details._id.toString()).toBe(session._id.toString());
      expect(details.partner._id.toString()).toBe(userB._id.toString());
    });

    test('Nên chặn người ngoài xem chi tiết cuộc gọi', async () => {
      await expect(
        matchSessionService.getMatchSessionDetails(session._id, userC._id)
      ).rejects.toThrow('Không có quyền truy cập phiên này.');
    });
  });
});
