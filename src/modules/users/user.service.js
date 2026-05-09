import User from './User.js';
import MatchSession from '../match/MatchSession.js';
import UserReview from './UserReview.js';
import Appeal from './Appeal.js';
import presenceService from '../presence/presence.service.js';
import ApiError from '../../core/utils/ApiError.js';
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
    if (!user) throw new ApiError(404, 'Tài khoản không tồn tại');

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
    const onlineFriendIds = await presenceService.getOnlineFriendIds(userId);
    const shuffledIds = onlineFriendIds.sort(() => 0.5 - Math.random()).slice(0, 4);
    const onlineFriends = await User.find({ _id: { $in: shuffledIds } })
        .select('profile.fullName profile.avatar profile.country')
        .lean();
    const suggestedPartners = onlineFriends.map(u => ({
        _id: u._id,
        fullName: u.profile?.fullName,
        avatar: u.profile?.avatar,
        country: u.profile?.country,
        isOnline: true
    }));

    const profileData = user.toJSON();
    return {
        ...profileData,
        greeting: `${greetingText}, ${firstName}`,
        stats: {
            ...profileData.stats,
            totalHours: parseFloat((profileData.stats?.totalHours || 0).toFixed(1)),
            learningCalendar: Array.from(learningCalendar)
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

    // 1. Lấy thống kê số phiên và tổng thời gian từ cache của User (O(1))
    const totalSessions = user.stats?.totalSessions || 0;
    const totalHours = user.stats?.totalHours?.toFixed(1) || "0.0";

    // 2. Tính chuỗi ngày đăng nhập liên tiếp (Streak - O(1))
    const now = new Date();

    // 3. Lịch sử học
    const learningCalendar = user.stats?.learningCalendar || [];

    // 4. Đối tác gợi ý
    const onlineFriendIds = await presenceService.getOnlineFriendIds(userId);
    const shuffledIds = onlineFriendIds.sort(() => 0.5 - Math.random()).slice(0, 4);

    const onlineFriends = await User.find({ _id: { $in: shuffledIds } })
        .select('profile.fullName profile.avatar profile.country')
        .lean();

    const suggestedPartners = onlineFriends.map(u => ({
        _id: u._id,
        fullName: u.profile?.fullName,
        avatar: u.profile?.avatar,
        country: u.profile?.country,
        isOnline: true
    }));

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

    const query = {
        _id: { $ne: userId },
        statusAccount: 'active',
        $or: [
            { 'profile.fullName': { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { 'profile.country': { $regex: keyword, $options: 'i' } }
        ]
    };

    const users = await User.find(query)
        .select('profile.fullName profile.avatar profile.country')
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await User.countDocuments(query);

    // Bổ sung trạng thái online
    const results = users.map(u => ({
        _id: u._id,
        fullName: u.profile?.fullName,
        avatar: u.profile?.avatar,
        country: u.profile?.country,
        isOnline: presenceService.isOnline(u._id.toString())
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

    // Kiểm tra xem đã có đơn pending chưa
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
    submitAppeal
};
