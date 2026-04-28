import User from '../models/User.js';
import MatchSession from '../models/MatchSession.js';
import UserReview from '../models/UserReview.js';
import presenceService from './presence.service.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';

const getUserById = async (id) => {
    const user = await User.findById(id).select('-password -__v -settings -status');
    if (!user) {
        throw new ApiError(404, 'Người dùng không tồn tại');
    }
    return user;
};

const getMyProfile = async (userId) => {
    const user = await User.findById(userId).select('-password -__v');
    return user;
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

    // 1. Lấy thống kê số phiên và tổng thời gian từ cache của User (O(1))
    const totalSessions = user.stats?.totalSessions || 0;
    const totalHours = user.stats?.totalHours?.toFixed(1) || "0.0";

    // 2. Tính chuỗi ngày đăng nhập liên tiếp (Streak - O(1))
    let currentStreak = user.stats?.streak || 0;
    // Hàm lấy chuỗi YYYY-MM-DD theo giờ Việt Nam (UTC+7)
    const getVnDateStr = (date) => {
        const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
    };

    const now = new Date();
    const todayStr = getVnDateStr(now);
    const lastUpdateStr = user.stats?.lastStreakUpdate ? getVnDateStr(user.stats.lastStreakUpdate) : null;

    if (lastUpdateStr !== todayStr) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = getVnDateStr(yesterday);

        if (lastUpdateStr === yesterdayStr) {
            currentStreak += 1;
        } else {
            currentStreak = 1;
        }

        User.findByIdAndUpdate(userId, {
            'stats.streak': currentStreak,
            'stats.lastStreakUpdate': now
        }).catch(err => console.error("Lỗi cập nhật streak:", err));
    }

    // 3. Lịch sử học trong tháng này (Lấy danh sách các ngày có học)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlySessions = await MatchSession.find({
        participants: userId,
        status: 'completed',
        createdAt: { $gte: startOfMonth }
    }).select('createdAt durationSeconds');

    // Gom nhóm theo ngày
    const learningCalendar = new Set();
    monthlySessions.forEach(session => {
        if (session.durationSeconds > 0) {
            learningCalendar.add(session.createdAt.getDate());
        }
    });

    // 4. Đối tác gợi ý (Random tối đa 4 bạn bè ĐANG ONLINE)
    const onlineFriendIds = await presenceService.getOnlineFriendIds(userId);

    // Shuffle array (thuật toán Fisher-Yates) và lấy 4 ID
    const shuffledIds = onlineFriendIds.sort(() => 0.5 - Math.random()).slice(0, 4);

    const onlineFriends = await User.find({ _id: { $in: shuffledIds } })
        .select('profile.fullName profile.avatar profile.nativeLanguage profile.learningLanguage')
        .lean();

    const suggestedPartners = onlineFriends.map(u => ({
        _id: u._id,
        fullName: u.profile?.fullName,
        avatar: u.profile?.avatar,
        nativeLanguage: u.profile?.nativeLanguage,
        learningLanguage: u.profile?.learningLanguage,
        isOnline: true // Chắc chắn là true vì đã lấy từ danh sách online
    }));

    return {
        greeting: `Chào buổi sáng, ${user.profile?.fullName?.split(' ').pop() || 'bạn'}`, // Lấy tên cuối
        stats: {
            streak: currentStreak,
            totalHours: parseFloat(totalHours),
            totalSessions: totalSessions
        },
        learningCalendar: Array.from(learningCalendar),
        suggestedPartners
    };
};

export default {
    getUserById,
    getMyProfile,
    updateMyProfile,
    uploadAvatar,
    getUserDashboard
};
