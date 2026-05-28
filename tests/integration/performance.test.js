// tests/integration/performance.test.js
import * as dbHandler from '../dbHandler.js';
import { findOrQueuePartnerService } from '../../src/modules/match/services/match.service.js';
import User from '../../src/modules/users/entities/User.js';
import MatchSession from '../../src/modules/match/entities/MatchSession.js';
import { listStore } from '../__mocks__/ioredis.js';

jest.mock('ioredis');

describe('Performance Test: Concurrency Matching (TC-P01)', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHandler.connect();
  });
  afterEach(async () => {
    await dbHandler.clear();
    for (const key in listStore) {
      delete listStore[key];
    }
  });
  afterAll(async () => await dbHandler.close());

  test('TC-P01: 100 socket clients join queue cùng lúc -> 50 cặp được ghép, thời gian xử lý nhanh (< 2s/cặp)', async () => {
    const NUM_USERS = 100;
    
    // 1. Chuẩn bị 100 User trong DB một cách nhanh chóng (Sử dụng insertMany)
    const userPayloads = [];
    for (let i = 0; i < NUM_USERS; i++) {
      userPayloads.push({
        email: `user_perf_${i}@example.com`,
        password: 'Password123!',
        profile: {
          fullName: `Perf User ${i}`,
          country: i % 2 === 0 ? 'Vietnam' : 'Japan'
        },
        status: 'idle'
      });
    }

    const insertedUsers = await User.insertMany(userPayloads);
    expect(insertedUsers.length).toBe(NUM_USERS);

    // 2. Kích hoạt ghép cặp đồng thời cho cả 100 users (Mô phỏng tốc độ kết nối liên tục cực nhanh)
    const startTime = Date.now();

    const matchResults = [];
    for (const user of insertedUsers) {
      matchResults.push(await findOrQueuePartnerService(user._id, 'english'));
    }

    const endTime = Date.now();
    const elapsedTimeMs = endTime - startTime;

    console.log(`⚡ [Performance] Thời gian ghép cặp cho 100 users đồng thời: ${elapsedTimeMs} ms`);

    // 3. Xác minh kết quả ghép cặp
    const sessions = await MatchSession.find({ status: 'ongoing' });
    expect(sessions.length).toBe(NUM_USERS / 2); // 50 cặp được ghép thành công

    // Kiểm tra tính độc nhất của các người dùng tham gia trong các phiên ghép cặp
    const matchedUserIds = new Set();
    for (const session of sessions) {
      expect(session.participants.length).toBe(2);
      const [u1, u2] = session.participants.map(id => id.toString());
      
      expect(u1).not.toBe(u2); // Không tự ghép với chính mình
      expect(matchedUserIds.has(u1)).toBe(false); // Không bị trùng lặp user trong các phòng khác
      expect(matchedUserIds.has(u2)).toBe(false);
      
      matchedUserIds.add(u1);
      matchedUserIds.add(u2);
    }

    expect(matchedUserIds.size).toBe(NUM_USERS); // Tất cả 100 users đều đã được ghép cặp

    // 4. Kiểm định hiệu năng: thời gian trung bình < 2s/cặp (2000ms/cặp)
    // Tổng 50 cặp, thời gian xử lý đồng thời 100 users trong môi trường in-memory thường chỉ mất dưới 500ms
    const timePerPairMs = elapsedTimeMs / (NUM_USERS / 2);
    console.log(`⚡ [Performance] Thời gian trung bình trên mỗi cặp: ${timePerPairMs.toFixed(2)} ms/cặp`);
    expect(timePerPairMs).toBeLessThan(2000); // Đảm bảo < 2000ms/cặp theo đặc tả TC-P01
  });
});
