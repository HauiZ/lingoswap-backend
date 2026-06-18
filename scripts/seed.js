import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../src/core/config/env.js';

// Import models
import User from '../src/modules/users/entities/User.js';
import Language from '../src/modules/admin/entities/Language.js';
import Friendship from '../src/modules/friends/entities/Friendship.js';
import MatchSession from '../src/modules/match/entities/MatchSession.js';
import Conversation from '../src/modules/chat/entities/Conversation.js';
import Message from '../src/modules/chat/entities/Message.js';
import UserReview from '../src/modules/users/entities/UserReview.js';
import Notification from '../src/modules/notifications/entities/Notification.js';
import Report from '../src/modules/reports/entities/Report.js';
import BlacklistKeyword from '../src/modules/admin/entities/BlacklistKeyword.js';
import Appeal from '../src/modules/users/entities/Appeal.js';

const now = new Date();
const getVnDateStr = (date) => {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

const getPastDate = (daysAgo) => {
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return getVnDateStr(date);
};

const seedData = async () => {
  try {
    console.log('🔄 Đang kết nối tới MongoDB...');
    await mongoose.connect(env.DB_URI);
    console.log('✅ Kết nối MongoDB thành công.');

    console.log('🧹 Đang dọn dẹp dữ liệu cũ...');
    await Promise.all([
      User.deleteMany({}),
      Language.deleteMany({}),
      Friendship.deleteMany({}),
      MatchSession.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      UserReview.deleteMany({}),
      Notification.deleteMany({}),
      Report.deleteMany({}),
      BlacklistKeyword.deleteMany({}),
      Appeal.deleteMany({}),
    ]);
    console.log('✅ Đã xóa dữ liệu cũ.');

    console.log('🌱 Đang tạo dữ liệu mẫu...');

    // 1. Tạo Languages
    const languages = [
      { code: 'vi', name: 'Tiếng Việt', iconCode: '🇻🇳', isActive: true },
      { code: 'en', name: 'Tiếng Anh', iconCode: '🇬🇧', isActive: true },
      { code: 'ja', name: 'Tiếng Nhật', iconCode: '🇯🇵', isActive: true },
      { code: 'ko', name: 'Tiếng Hàn', iconCode: '🇰🇷', isActive: true },
      { code: 'zh', name: 'Tiếng Trung', iconCode: '🇨🇳', isActive: true },
      { code: 'fr', name: 'Tiếng Pháp', iconCode: '🇫🇷', isActive: true },
    ];
    const createdLanguages = await Language.insertMany(languages);
    console.log(`✅ Đã tạo ${createdLanguages.length} ngôn ngữ.`);

    // 2. Tạo Users (Mật khẩu mặc định tuân thủ validation: LingoSwap@123)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('LingoSwap@123', salt);

    const usersData = [
      {
        email: 'admin@lingoswap.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'LingoSwap Admin',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
          bio: 'Hệ thống quản trị viên LingoSwap.',
          country: 'vi'
        },
        role: 'admin',
        statusAccount: 'active'
      },
      {
        email: 'hoang.nguyen@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Nguyễn Minh Hoàng',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hoang',
          bio: 'Chào mọi người! Mình muốn luyện tiếng Anh giao tiếp và sẵn sàng giúp các bạn học tiếng Việt.',
          country: 'vi'
        },
        role: 'user',
        statusAccount: 'active',
        stats: {
          streak: 5,
          lastStreakUpdate: now,
          totalHours: 12.5,
          totalSessions: 18,
          learningCalendar: [
            getPastDate(4),
            getPastDate(3),
            getPastDate(2),
            getPastDate(1),
            getPastDate(0)
          ]
        }
      },
      {
        email: 'alice.smith@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Alice Smith',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alice',
          bio: 'Hi! I am from London. Learning Vietnamese and loving it. Let\'s practice!',
          country: 'en'
        },
        role: 'user',
        statusAccount: 'active',
        stats: {
          streak: 3,
          lastStreakUpdate: now,
          totalHours: 8.2,
          totalSessions: 12,
          learningCalendar: [
            getPastDate(2),
            getPastDate(1),
            getPastDate(0)
          ]
        }
      },
      {
        email: 'kenji.sato@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Kenji Sato',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=kenji',
          bio: 'こんにちは！I love traveling and exchange languages. Learning English and Vietnamese.',
          country: 'ja'
        },
        role: 'user',
        statusAccount: 'active',
        stats: {
          streak: 1,
          lastStreakUpdate: now,
          totalHours: 4.5,
          totalSessions: 6,
          learningCalendar: [
            getPastDate(0)
          ]
        }
      },
      {
        email: 'jiwon.kim@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Kim Ji-won',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jiwon',
          bio: '안녕하세요. Let\'s study Korean and English together. Feel free to call me!',
          country: 'ko'
        },
        role: 'user',
        statusAccount: 'active',
        stats: {
          streak: 10,
          lastStreakUpdate: now,
          totalHours: 25.0,
          totalSessions: 32,
          learningCalendar: [
            getPastDate(9),
            getPastDate(8),
            getPastDate(7),
            getPastDate(6),
            getPastDate(5),
            getPastDate(4),
            getPastDate(3),
            getPastDate(2),
            getPastDate(1),
            getPastDate(0)
          ]
        }
      },
      {
        email: 'mei.ling@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Mei Ling',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=mei',
          bio: 'Hi there! Practicing Vietnamese and English. Glad to meet you guys.',
          country: 'zh'
        },
        role: 'user',
        statusAccount: 'active'
      },
      {
        email: 'pierre.dubois@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Pierre Dubois',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=pierre',
          bio: 'Bonjour! Learning Vietnamese. I can help you with French.',
          country: 'fr'
        },
        role: 'user',
        statusAccount: 'active'
      },
      {
        email: 'tran.thi.lan@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Trần Thị Lan',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lan',
          bio: 'Xin chào, mình đang học tiếng Nhật và tiếng Hàn.',
          country: 'vi'
        },
        role: 'user',
        statusAccount: 'active'
      },
      {
        email: 'toxic.user@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Toxic User',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=toxic',
          bio: 'I am here to cause trouble.',
          country: 'en'
        },
        role: 'user',
        statusAccount: 'warned'
      },
      {
        email: 'trunghau15129@gmail.com',
        password: hashedPassword,
        authProvider: 'local',
        profile: {
          fullName: 'Trung Hậu',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=trunghau',
          bio: 'Chào mọi người! Mình là Trung Hậu, lập trình viên hệ thống LingoSwap.',
          country: 'vi'
        },
        role: 'user',
        statusAccount: 'active',
        stats: {
          streak: 7,
          lastStreakUpdate: now,
          totalHours: 15.0,
          totalSessions: 22,
          learningCalendar: [
            getPastDate(6),
            getPastDate(5),
            getPastDate(4),
            getPastDate(3),
            getPastDate(2),
            getPastDate(1),
            getPastDate(0)
          ]
        }
      }
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`✅ Đã tạo ${createdUsers.length} tài khoản người dùng.`);

    // Map email -> user object
    const userMap = {};
    createdUsers.forEach(u => {
      userMap[u.email] = u;
    });

    const hoang = userMap['hoang.nguyen@gmail.com'];
    const alice = userMap['alice.smith@gmail.com'];
    const kenji = userMap['kenji.sato@gmail.com'];
    const jiwon = userMap['jiwon.kim@gmail.com'];
    const mei = userMap['mei.ling@gmail.com'];
    const pierre = userMap['pierre.dubois@gmail.com'];
    const lan = userMap['tran.thi.lan@gmail.com'];
    const toxic = userMap['toxic.user@gmail.com'];
    const trunghau = userMap['trunghau15129@gmail.com'];
    const admin = userMap['admin@lingoswap.com'];

    // 3. Tạo Friendships
    const friendships = [
      { requesterId: hoang._id, recipientId: alice._id, status: 'accepted', respondedAt: new Date() },
      { requesterId: hoang._id, recipientId: jiwon._id, status: 'accepted', respondedAt: new Date() },
      { requesterId: hoang._id, recipientId: kenji._id, status: 'pending' },
      { requesterId: alice._id, recipientId: pierre._id, status: 'accepted', respondedAt: new Date() },
      { requesterId: jiwon._id, recipientId: lan._id, status: 'accepted', respondedAt: new Date() },
      { requesterId: hoang._id, recipientId: toxic._id, status: 'blocked' },
      { requesterId: hoang._id, recipientId: trunghau._id, status: 'accepted', respondedAt: new Date() },
      { requesterId: trunghau._id, recipientId: alice._id, status: 'accepted', respondedAt: new Date() },
    ];
    const createdFriendships = await Friendship.insertMany(friendships);
    console.log(`✅ Đã tạo ${createdFriendships.length} mối quan hệ bạn bè.`);

    // 4. Tạo Match Sessions
    const matchSessions = [
      {
        participants: [hoang._id, alice._id],
        language: 'en',
        suggestedTopic: 'Food & Culture in London vs Hanoi',
        status: 'completed',
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        endedAt: new Date(Date.now() - 3600000 + 600000), // 10 mins duration
      },
      {
        participants: [hoang._id, jiwon._id],
        language: 'ko',
        suggestedTopic: 'K-Pop and Vietnamese food',
        status: 'completed',
        startedAt: new Date(Date.now() - 7200000), // 2 hours ago
        endedAt: new Date(Date.now() - 7200000 + 1200000), // 20 mins duration
      },
      {
        participants: [kenji._id, lan._id],
        language: 'ja',
        suggestedTopic: 'Anime & Vietnamese Traditional Festivals',
        status: 'completed',
        startedAt: new Date(Date.now() - 86400000), // 1 day ago
        endedAt: new Date(Date.now() - 86400000 + 900000), // 15 mins duration
      },
      {
        participants: [hoang._id, kenji._id],
        language: 'ja',
        suggestedTopic: 'Hobbies & Travel plans',
        status: 'ongoing',
        startedAt: new Date(Date.now() - 300000), // 5 mins ago
      },
      {
        participants: [trunghau._id, hoang._id],
        language: 'vi',
        suggestedTopic: 'Coding & Life balance',
        status: 'completed',
        startedAt: new Date(Date.now() - 1800000), // 30 mins ago
        endedAt: new Date(Date.now() - 1800000 + 900000), // 15 mins duration
      }
    ];

    const createdSessions = await MatchSession.insertMany(matchSessions);
    console.log(`✅ Đã tạo ${createdSessions.length} phiên ghép đôi.`);

    // 5. Tạo User Reviews
    const reviews = [
      {
        reviewerId: alice._id,
        targetUserId: hoang._id,
        matchSessionId: createdSessions[0]._id,
        rating: 5,
        comment: 'Hoàng giao tiếp tiếng Anh rất tự tin và hướng dẫn mình nói tiếng Việt cực kỳ chi tiết!'
      },
      {
        reviewerId: hoang._id,
        targetUserId: alice._id,
        matchSessionId: createdSessions[0]._id,
        rating: 5,
        comment: 'Alice nói tiếng Việt siêu dễ thương, phát âm rất chuẩn. Chắc chắn sẽ trò chuyện lại!'
      },
      {
        reviewerId: hoang._id,
        targetUserId: jiwon._id,
        matchSessionId: createdSessions[1]._id,
        rating: 4,
        comment: 'Jiwon thân thiện, nhưng kết nối mạng bên phía bạn ấy hơi chập chờn một chút.'
      }
    ];
    const createdReviews = await UserReview.insertMany(reviews);
    console.log(`✅ Đã tạo ${createdReviews.length} lượt đánh giá người dùng.`);

    // 6. Tạo Conversations & Messages
    // Conversation 1: Bạn bè giữa Hoang và Alice (Permanent)
    const convHoangAlice = await Conversation.create({
      participants: [hoang._id, alice._id],
      isPermanent: true,
      matchSessionId: createdSessions[0]._id
    });

    const messagesHoangAlice = [
      {
        conversationId: convHoangAlice._id,
        senderId: alice._id,
        type: 'text',
        content: 'Hi Hoàng! Rất vui được kết bạn với bạn qua cuộc trò chuyện vừa rồi.',
        status: 'read'
      },
      {
        conversationId: convHoangAlice._id,
        senderId: hoang._id,
        type: 'text',
        content: 'Chào Alice! Mình cũng rất vui. Cảm ơn bạn đã nói chuyện cùng mình.',
        status: 'read'
      },
      {
        conversationId: convHoangAlice._id,
        senderId: alice._id,
        type: 'text',
        content: 'Do you want to practice English more? I can help you check grammar.',
        status: 'read'
      },
      {
        conversationId: convHoangAlice._id,
        senderId: hoang._id,
        type: 'text',
        content: 'Yes, I am ready. I wants to practice English.',
        status: 'read',
        grammarCorrection: {
          isCorrected: true,
          correctedText: 'Yes, I am ready. I want to practice English.',
          explanation: 'Sử dụng "want" nguyên mẫu cho chủ ngữ "I", không thêm "s".'
        }
      }
    ];

    const createdMsgs1 = await Message.insertMany(messagesHoangAlice);
    convHoangAlice.lastMessage = createdMsgs1[createdMsgs1.length - 1]._id;
    await convHoangAlice.save();

    // Conversation 2: Phiên Match giữa Hoang và Jiwon (Temporary)
    const convHoangJiwon = await Conversation.create({
      participants: [hoang._id, jiwon._id],
      isPermanent: false,
      matchSessionId: createdSessions[1]._id
    });

    const messagesHoangJiwon = [
      {
        conversationId: convHoangJiwon._id,
        senderId: jiwon._id,
        type: 'text',
        content: '안녕하세요! (Xin chào!)',
        status: 'read'
      },
      {
        conversationId: convHoangJiwon._id,
        senderId: hoang._id,
        type: 'text',
        content: 'Chào bạn! Rất vui được kết nối.',
        status: 'read'
      }
    ];
    const createdMsgs2 = await Message.insertMany(messagesHoangJiwon);
    convHoangJiwon.lastMessage = createdMsgs2[createdMsgs2.length - 1]._id;
    await convHoangJiwon.save();

    // Conversation 3: Bạn bè giữa trunghau và hoang
    const convTrungHauHoang = await Conversation.create({
      participants: [trunghau._id, hoang._id],
      isPermanent: true,
      matchSessionId: createdSessions[4]._id
    });
    const messagesTrungHauHoang = [
      {
        conversationId: convTrungHauHoang._id,
        senderId: trunghau._id,
        type: 'text',
        content: 'Chào Hoàng! App chạy mượt mà quá nha!',
        status: 'read'
      },
      {
        conversationId: convTrungHauHoang._id,
        senderId: hoang._id,
        type: 'text',
        content: 'Cảm ơn anh Hậu đã hỗ trợ sửa lỗi validation nha!',
        status: 'read'
      }
    ];
    const createdMsgs3 = await Message.insertMany(messagesTrungHauHoang);
    convTrungHauHoang.lastMessage = createdMsgs3[createdMsgs3.length - 1]._id;
    await convTrungHauHoang.save();

    console.log('✅ Đã tạo các cuộc hội thoại và tin nhắn mẫu.');

    // 7. Tạo Blacklist Keywords
    const blacklist = [
      { keyword: 'scam', createdBy: admin._id },
      { keyword: 'hack', createdBy: admin._id },
      { keyword: 'chửi bậy', createdBy: admin._id },
      { keyword: 'dốt nát', createdBy: admin._id },
      { keyword: 'lừa đảo', createdBy: admin._id },
    ];
    await BlacklistKeyword.insertMany(blacklist);
    console.log('✅ Đã tạo từ khóa trong danh sách đen.');

    // 8. Tạo Reports
    const reports = [
      {
        reporterId: hoang._id,
        reportedUserId: toxic._id,
        reason: 'Người dùng này liên tục nhắn tin chào mời dịch vụ quảng cáo lừa đảo.',
        status: 'pending'
      }
    ];
    await Report.insertMany(reports);
    console.log('✅ Đã tạo báo cáo vi phạm mẫu.');

    // 9. Tạo Notifications
    const notifications = [
      {
        recipientId: hoang._id,
        senderId: kenji._id,
        type: 'friend_request',
        content: 'Kenji Sato đã gửi cho bạn một lời mời kết bạn.',
        metadata: {
          friendshipId: createdFriendships[2]._id
        }
      },
      {
        recipientId: alice._id,
        senderId: hoang._id,
        type: 'friend_accepted',
        content: 'Nguyễn Minh Hoàng đã chấp nhận lời mời kết bạn.',
        metadata: {
          friendshipId: createdFriendships[0]._id
        }
      }
    ];
    await Notification.insertMany(notifications);
    console.log('✅ Đã tạo thông báo mẫu.');

    console.log('\n🎉 ĐÃ HOÀN THÀNH TẠO DỮ LIỆU MẪU THÀNH CÔNG! 🎉');
  } catch (error) {
    console.error('❌ Lỗi khi gieo dữ liệu mẫu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB.');
  }
};

seedData();
