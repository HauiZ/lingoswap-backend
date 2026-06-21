import User from '../entities/User.js';
import UserReview from '../entities/UserReview.js';
import Appeal from '../entities/Appeal.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';
import { createServiceClient } from '../http/serviceClient.js';

const checkAndResetStreak = async (user) => {
    if (!user || !user.stats || user.stats.streak === 0) return user;

    const now = new Date();
    const getVnDateStr = (date) => {
        const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
    };

    const lastUpdateStr = user.stats.lastStreakUpdate ? getVnDateStr(user.stats.lastStreakUpdate) : null;
    const todayStr = getVnDateStr(now);
    const yesterdayStr = getVnDateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    if (lastUpdateStr && lastUpdateStr !== todayStr && lastUpdateStr !== yesterdayStr) {
        user.stats.streak = 0;
        await user.save();
    }
    return user;
};

const getUserById = async (id) => {
    const user = await User.findById(id).select('-password -__v -settings -status');
    if (!user) {
        throw new ApiError(404, 'Người dùng không tồn tại');
    }
    await checkAndResetStreak(user);
    return user;
};

const getMyProfile = async (userId) => {
    const user = await User.findById(userId).select('-password -__v');
    if (!user) throw new ApiError(404, 'Tài khoản không tồn tại');

    await checkAndResetStreak(user);

    const now = new Date();

    // Greeting theo giờ Việt Nam
    const vnHour = new Date(now.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
    let greetingText = 'Chào buổi sáng';
    if (vnHour >= 12 && vnHour < 18) greetingText = 'Chào buổi chiều';
    else if (vnHour >= 18 || vnHour < 5) greetingText = 'Chào buổi tối';
    const firstName = user.profile?.fullName?.split(' ').pop() || 'bạn';

    // Learning calendar — danh sách ngày đã học (YYYY-MM-DD)
    const learningCalendar = user.stats?.learningCalendar || [];

    // Suggested partners (bạn bè online, random 4)
    let suggestedPartners = [];
    try {
        const presenceClient = createServiceClient('presence');
        const { data } = await presenceClient.get(`/internal/presence/${userId}/friends/online`);
        const onlineFriendIds = data?.friendIds || data || [];
        const shuffledIds = onlineFriendIds.sort(() => 0.5 - Math.random()).slice(0, 4);
        const onlineFriends = await User.find({ _id: { $in: shuffledIds } })
            .select('profile.fullName profile.avatar profile.country')
            .lean();
        suggestedPartners = onlineFriends.map(u => ({
            _id: u._id,
            fullName: u.profile?.fullName,
            avatar: u.profile?.avatar,
            country: u.profile?.country,
            isOnline: true
        }));
    } catch (err) {
        console.error('Failed to get online friend suggestions:', err.message);
    }

    const profileData = user.toJSON();
    return {
        ...profileData,
        greeting: `${greetingText}, ${firstName}`,
        stats: {
            ...profileData.stats,
            totalHours: parseFloat((profileData.stats?.totalHours || 0).toFixed(1)),
            learningCalendar: Array.from(learningCalendar),
        },
        suggestedPartners
    };
};

const updateMyProfile = async (userId, { profile, settings }) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'Tài khoản không tồn tại');
    }

    if (profile) {
        user.profile = { ...user.profile, ...profile };
    }

    if (settings) {
        user.settings = { ...user.settings, ...settings };
    }

    await user.save();
    return await User.findById(userId).select('-password -__v');
};

const uploadAvatar = async (userId, file) => {
    if (!file) {
        throw new ApiError(400, 'Vui lòng cung cấp file ảnh');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'Tài khoản không tồn tại');
    }

    user.profile.avatar = file.path;
    await user.save();

    return file.path;
};

const getUserDashboard = async (userId) => {
    const user = await User.findById(userId).select('profile stats');
    if (!user) throw new ApiError(404, 'Tài khoản không tồn tại');

    await checkAndResetStreak(user);

    // Lấy thống kê số phiên và tổng thời gian từ cache của User (O(1))
    const totalSessions = user.stats?.totalSessions || 0;
    const totalHours = user.stats?.totalHours?.toFixed(1) || "0.0";

    // Lịch sử học
    const learningCalendar = user.stats?.learningCalendar || [];

    // Đối tác gợi ý
    let suggestedPartners = [];
    try {
        const presenceClient = createServiceClient('presence');
        const { data } = await presenceClient.get(`/internal/presence/${userId}/friends/online`);
        const onlineFriendIds = data?.friendIds || data || [];
        const shuffledIds = onlineFriendIds.sort(() => 0.5 - Math.random()).slice(0, 4);

        const onlineFriends = await User.find({ _id: { $in: shuffledIds } })
            .select('profile.fullName profile.avatar profile.country')
            .lean();

        suggestedPartners = onlineFriends.map(u => ({
            _id: u._id,
            fullName: u.profile?.fullName,
            avatar: u.profile?.avatar,
            country: u.profile?.country,
            isOnline: true
        }));
    } catch (err) {
        console.error('Failed to get online friend suggestions for dashboard:', err.message);
    }

    return {
        greeting: `Chào buổi sáng, ${user.profile?.fullName?.split(' ').pop() || 'bạn'}`, // Lấy tên cuối
        stats: {
            streak: user.stats?.streak || 0,
            totalHours: parseFloat(totalHours),
            totalSessions: totalSessions
        },
        learningCalendar: Array.from(learningCalendar),
        suggestedPartners
    };
};

const searchUsers = async (userId, keyword, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    // Lấy danh sách bạn bè qua Friend Service
    let friendIds = [];
    try {
        const friendClient = createServiceClient('friend');
        const { data } = await friendClient.get(`/internal/friends/${userId}/ids`);
        friendIds = data?.friendIds || data || [];
    } catch (err) {
        console.error('Failed to get friend IDs for searchUsers:', err.message);
    }

    const friendObjectIds = friendIds.map(id => new mongoose.Types.ObjectId(id));

    const query = {
        _id: { $ne: userObjectId },
        statusAccount: 'active',
        $or: [
            { 'profile.fullName': { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { 'profile.country': { $regex: keyword, $options: 'i' } }
        ]
    };

    const pipeline = [
        { $match: query },
        {
            $addFields: {
                isFriend: { $in: ["$_id", friendObjectIds] }
            }
        },
        { $sort: { isFriend: -1, _id: 1 } },
        { $skip: skip },
        { $limit: Number(limit) },
        {
            $project: {
                'profile.fullName': 1,
                'profile.avatar': 1,
                'profile.country': 1,
                isFriend: 1
            }
        }
    ];

    const users = await User.aggregate(pipeline);
    const total = await User.countDocuments(query);

    // Bổ sung trạng thái online bulk qua Presence Service
    const userIds = users.map(u => u._id.toString());
    let onlineStatusMap = {};
    if (userIds.length > 0) {
        try {
            const presenceClient = createServiceClient('presence');
            const { data } = await presenceClient.post('/internal/presence/status/bulk', { userIds });
            onlineStatusMap = data || {};
        } catch (err) {
            console.error('Failed to get bulk presence status for searchUsers:', err.message);
        }
    }

    const results = users.map(u => ({
        _id: u._id,
        fullName: u.profile?.fullName,
        avatar: u.profile?.avatar,
        country: u.profile?.country,
        isFriend: u.isFriend,
        isOnline: !!onlineStatusMap[u._id.toString()]
    }));

    return {
        results,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
};

const searchFriends = async (userId, keyword, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    // Lấy danh sách bạn bè qua Friend Service
    let friendIds = [];
    try {
        const friendClient = createServiceClient('friend');
        const { data } = await friendClient.get(`/internal/friends/${userId}/ids`);
        friendIds = data?.friendIds || data || [];
    } catch (err) {
        console.error('Failed to get friend IDs for searchFriends:', err.message);
        return {
            results: [],
            pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 }
        };
    }

    if (friendIds.length === 0) {
        return {
            results: [],
            pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 }
        };
    }

    const friendObjectIds = friendIds.map(id => new mongoose.Types.ObjectId(id));

    // Lấy danh sách các cuộc hội thoại gần đây qua Chat Service
    let conversations = [];
    try {
        const chatClient = createServiceClient('chat');
        const { data } = await chatClient.get(`/internal/conversations/recent-interacted/${userId}`);
        conversations = data?.conversations || data || [];
    } catch (err) {
        console.error('Failed to get recent interacted conversations for searchFriends:', err.message);
    }

    // Map friendId -> updatedAt timestamp
    const interactMap = {};
    conversations.forEach(conv => {
        const pFriendId = conv.participants?.find(p => p.toString() !== userObjectId.toString());
        if (pFriendId) {
            interactMap[pFriendId.toString()] = new Date(conv.updatedAt).getTime();
        }
    });

    // Build query tìm kiếm user theo keyword
    const query = {
        _id: { $in: friendObjectIds },
        statusAccount: 'active'
    };

    if (keyword) {
        query.$or = [
            { 'profile.fullName': { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { 'profile.country': { $regex: keyword, $options: 'i' } }
        ];
    }

    let matchedUsers = await User.find(query)
        .select('profile.fullName profile.avatar profile.country')
        .lean();

    // Sort trên RAM dựa vào interactMap
    matchedUsers.sort((a, b) => {
        const timeA = interactMap[a._id.toString()] || 0;
        const timeB = interactMap[b._id.toString()] || 0;

        if (timeB === timeA) {
            return a._id.toString().localeCompare(b._id.toString());
        }
        return timeB - timeA;
    });

    const total = matchedUsers.length;
    const paginatedUsers = matchedUsers.slice(skip, skip + Number(limit));

    // Get bulk presence status
    const paginatedUserIds = paginatedUsers.map(u => u._id.toString());
    let onlineStatusMap = {};
    if (paginatedUserIds.length > 0) {
        try {
            const presenceClient = createServiceClient('presence');
            const { data } = await presenceClient.post('/internal/presence/status/bulk', { userIds: paginatedUserIds });
            onlineStatusMap = data || {};
        } catch (err) {
            console.error('Failed to get bulk presence status for searchFriends:', err.message);
        }
    }

    const results = paginatedUsers.map(u => ({
        _id: u._id,
        fullName: u.profile?.fullName,
        avatar: u.profile?.avatar,
        country: u.profile?.country,
        isFriend: true,
        lastInteractAt: interactMap[u._id.toString()] ? new Date(interactMap[u._id.toString()]) : new Date(0),
        isOnline: !!onlineStatusMap[u._id.toString()]
    }));

    return {
        results,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
};

const submitAppeal = async (userId, reason) => {
    if (!reason) {
        throw new ApiError(400, 'Vui lòng cung cấp lý do kháng cáo');
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'Tài khoản không tồn tại');

    if (user.statusAccount !== 'banned') {
        throw new ApiError(400, 'Tài khoản của bạn không ở trạng thái bị khóa');
    }

    const existingAppeal = await Appeal.findOne({ userId: user._id, status: 'pending' });
    if (existingAppeal) {
        throw new ApiError(400, 'Bạn đã có một đơn kháng cáo đang chờ xử lý. Vui lòng kiên nhẫn.');
    }

    const newAppeal = await Appeal.create({
        userId: user._id,
        reason: reason.trim()
    });

    return newAppeal;
};

export default {
    getUserById,
    getMyProfile,
    updateMyProfile,
    uploadAvatar,
    getUserDashboard,
    searchUsers,
    searchFriends,
    submitAppeal
};
