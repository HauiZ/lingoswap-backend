import BlacklistKeyword from '../entities/BlacklistKeyword.js';
import redis from '../config/redis.js';
import eventBus from '../config/eventBus.js';
import { EventTypes } from '../events/eventTypes.js';
import { createServiceClient } from '../http/serviceClient.js';
import ApiError from '../utils/ApiError.js';

const getAllUsers = async () => {
    const userClient = createServiceClient('user');
    const { data } = await userClient.get('/internal/users');
    return data || [];
};

const banUser = async (id) => {
    const userClient = createServiceClient('user');
    // Ban vĩnh viễn mặc định
    const { data: user } = await userClient.patch(`/internal/users/${id}/ban`, { bannedUntil: null });
    
    // Thêm vào Redis blacklist (ban vĩnh viễn tạm thời tính bằng 7 ngày trong blacklist check)
    await redis.set(`blacklist:banned:${id}`, '1', 'EX', 7 * 24 * 60 * 60);

    // Bắn event disconnect và notify
    await eventBus.publish(EventTypes.USER_BANNED, {
        userId: id.toString(),
        reason: 'Khóa tài khoản bởi Admin.'
    });

    await eventBus.publish('socket.force_disconnect', { userId: id.toString() });

    return user;
};

const deleteUser = async (id) => {
    const userClient = createServiceClient('user');
    const { data } = await userClient.delete(`/internal/users/${id}`);
    return data;
};

const getAllReports = async (statusFilter, limit = 20, page = 1) => {
    const reportClient = createServiceClient('report');
    const { data: reports } = await reportClient.get(`/internal/reports?status=${statusFilter || ''}&limit=${limit}&page=${page}`);

    if (!reports || reports.length === 0) return [];

    // Collect all unique user IDs to populate names and emails
    const userIds = Array.from(new Set(reports.flatMap(r => [
        r.reporterId,
        r.reportedUserId,
        r.resolvedByAdminId
    ].filter(Boolean))));

    let usersMap = {};
    if (userIds.length > 0) {
        try {
            const userClient = createServiceClient('user');
            const { data: users } = await userClient.post('/internal/users/bulk', { userIds });
            if (users && Array.isArray(users)) {
                users.forEach(u => {
                    usersMap[u._id.toString()] = u;
                });
            }
        } catch (err) {
            console.error('[Admin Service] Failed to bulk fetch users for reports populate:', err.message);
        }
    }

    return reports.map(r => ({
        ...r,
        reporterId: r.reporterId ? usersMap[r.reporterId.toString()] || { _id: r.reporterId } : null,
        reportedUserId: r.reportedUserId ? usersMap[r.reportedUserId.toString()] || { _id: r.reportedUserId } : null,
        resolvedByAdminId: r.resolvedByAdminId ? usersMap[r.resolvedByAdminId.toString()] || { _id: r.resolvedByAdminId } : null
    }));
};

const resolveReport = async (reportId, adminId, payload) => {
    const { status, adminNotes, banDuration } = payload;

    const reportClient = createServiceClient('report');
    const { data: report } = await reportClient.patch(`/internal/reports/${reportId}/resolve`, {
        status,
        adminNotes,
        resolvedByAdminId: adminId
    });

    if (!report) throw new ApiError(404, 'Báo cáo không tồn tại');

    if (banDuration && status === 'resolved') {
        const reportedUserId = report.reportedUserId;
        const now = new Date();
        let bannedUntil = null;

        if (banDuration === '3_days') {
            bannedUntil = new Date(now.setDate(now.getDate() + 3));
        } else if (banDuration === '7_days') {
            bannedUntil = new Date(now.setDate(now.getDate() + 7));
        } else if (banDuration === '30_days') {
            bannedUntil = new Date(now.setDate(now.getDate() + 30));
        } else if (banDuration === 'permanent') {
            bannedUntil = null;
        }

        try {
            const userClient = createServiceClient('user');
            await userClient.patch(`/internal/users/${reportedUserId}/ban`, { bannedUntil });
            
            await redis.set(`blacklist:banned:${reportedUserId}`, '1', 'EX', 7 * 24 * 60 * 60);

            // Bắn event USER_BANNED
            await eventBus.publish(EventTypes.USER_BANNED, {
                userId: reportedUserId.toString(),
                reason: adminNotes || 'Vi phạm điều khoản cộng đồng.'
            });

            // Ngắt kết nối socket lập tức
            await eventBus.publish('socket.force_disconnect', { userId: reportedUserId.toString() });
        } catch (err) {
            console.error('[Admin Service] Failed to execute ban operations for user:', reportedUserId, err.message);
        }
    }

    return report;
};

const getDashboardStats = async () => {
    const userClient = createServiceClient('user');
    const matchClient = createServiceClient('match');
    const chatClient = createServiceClient('chat');
    const reportClient = createServiceClient('report');
    const friendClient = createServiceClient('friend');
    const presenceClient = createServiceClient('presence');

    const [userStatsRes, matchStatsRes, messageStatsRes, reportStatsRes, friendshipStatsRes, onlineCountRes] = await Promise.allSettled([
        userClient.get('/internal/users/stats'),
        matchClient.get('/internal/matches/stats'),
        chatClient.get('/internal/messages/stats'),
        reportClient.get('/internal/reports/stats'),
        friendClient.get('/internal/friends/stats'),
        presenceClient.get('/internal/presence/online/count')
    ]);

    const userStats = userStatsRes.status === 'fulfilled' ? userStatsRes.value.data : { totalUsers: 0, activeUsers: 0, bannedUsers: 0 };
    const matchStats = matchStatsRes.status === 'fulfilled' ? matchStatsRes.value.data : { total: 0, today: 0, thisWeek: 0, avgDurationSeconds: 0, totalDurationSeconds: 0, chart: [] };
    const messageStats = messageStatsRes.status === 'fulfilled' ? messageStatsRes.value.data : { totalMessages: 0 };
    const reportStats = reportStatsRes.status === 'fulfilled' ? reportStatsRes.value.data : { total: 0, pending: 0, resolved: 0 };
    const friendshipStats = friendshipStatsRes.status === 'fulfilled' ? friendshipStatsRes.value.data : { totalFriendships: 0 };
    const onlineCount = onlineCountRes.status === 'fulfilled' ? onlineCountRes.value.data.count : 0;

    return {
        users: {
            total: userStats.totalUsers,
            active: userStats.activeUsers,
            banned: userStats.bannedUsers,
            online: onlineCount,
            newToday: 0, // Mocked or fetched if detailed chart exists
            newThisWeek: 0,
            newThisMonth: 0
        },
        matchSessions: {
            total: matchStats.total,
            today: matchStats.today,
            thisWeek: matchStats.thisWeek,
            avgDurationSeconds: matchStats.avgDurationSeconds,
            totalDurationSeconds: matchStats.totalDurationSeconds
        },
        messages: {
            total: messageStats.totalMessages,
            today: 0,
            thisWeek: 0
        },
        reports: {
            total: reportStats.total,
            pending: reportStats.pending,
            resolved: reportStats.resolved,
            today: 0
        },
        friendships: {
            total: friendshipStats.totalFriendships
        },
        charts: {
            newUsersLast7Days: [],
            sessionsLast7Days: matchStats.chart || []
        }
    };
};

const addBlacklistKeyword = async (keywordText, adminId) => {
    if (!keywordText || typeof keywordText !== 'string' || !keywordText.trim()) {
        throw new ApiError(400, 'Từ khóa không được để trống');
    }
    const cleanKeyword = keywordText.trim().toLowerCase();
    
    const existing = await BlacklistKeyword.findOne({ keyword: cleanKeyword });
    if (existing) {
        throw new ApiError(400, 'Từ khóa này đã tồn tại trong danh sách cấm');
    }

    const newKeyword = await BlacklistKeyword.create({
        keyword: cleanKeyword,
        createdBy: adminId
    });

    return newKeyword;
};

const getBlacklistKeywords = async ({ search, page = 1, limit = 20 } = {}) => {
    let query = {};
    if (search) {
        query.keyword = { $regex: search.trim().toLowerCase(), $options: 'i' };
    }

    const total = await BlacklistKeyword.countDocuments(query);
    const keywords = await BlacklistKeyword.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

    // Populate createdBy
    const adminIds = keywords.map(k => k.createdBy?.toString()).filter(Boolean);
    let adminsMap = {};
    if (adminIds.length > 0) {
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.post('/internal/users/bulk', { userIds: adminIds });
            if (data && Array.isArray(data)) {
                data.forEach(adm => {
                    adminsMap[adm._id.toString()] = adm;
                });
            }
        } catch (err) {
            console.error('[Admin Service] Failed to populate keywords creators:', err.message);
        }
    }

    const enrichedKeywords = keywords.map(k => ({
        ...k,
        createdBy: k.createdBy ? adminsMap[k.createdBy.toString()] || { _id: k.createdBy } : null
    }));

    return {
        total,
        page: Number(page),
        limit: Number(limit),
        keywords: enrichedKeywords
    };
};

const deleteBlacklistKeyword = async (id) => {
    const deleted = await BlacklistKeyword.findByIdAndDelete(id);
    if (!deleted) {
        throw new ApiError(404, 'Từ khóa không tồn tại');
    }
    return deleted;
};

const checkContainsBlacklistKeyword = async (text) => {
    if (!text || typeof text !== 'string') return { hasKeyword: false };
    const cleanText = text.toLowerCase();

    const keywords = await BlacklistKeyword.find({ isActive: true }).select('keyword');

    for (const item of keywords) {
        if (cleanText.includes(item.keyword)) {
            return { hasKeyword: true, matchedKeyword: item.keyword };
        }
    }

    return { hasKeyword: false };
};

const getAllAppeals = async (statusFilter, limit = 20, page = 1) => {
    const userClient = createServiceClient('user');
    const { data: appeals } = await userClient.get(`/internal/users/appeals?status=${statusFilter || ''}&limit=${limit}&page=${page}`);

    if (!appeals || appeals.length === 0) return [];

    const reportClient = createServiceClient('report');

    const appealsWithReason = await Promise.all(appeals.map(async (appeal) => {
        let latestReport = null;
        if (appeal.userId && appeal.userId._id) {
            try {
                // Lấy reports có status = resolved của user này
                const { data: reports } = await reportClient.get(`/internal/reports?reportedUserId=${appeal.userId._id}&status=resolved&limit=1`);
                latestReport = reports && reports[0] ? reports[0] : null;
            } catch (err) {
                console.error('[Admin Service] Failed to query latest report for appeal user:', appeal.userId._id, err.message);
            }
        }
        
        return {
            ...appeal,
            banReason: latestReport ? (latestReport.adminNotes || 'Vi phạm quy tắc cộng đồng.') : 'Khóa thủ công bởi Admin.'
        };
    }));

    return appealsWithReason;
};

const resolveAppeal = async (appealId, adminId, payload) => {
    const { status, adminNotes } = payload;

    const userClient = createServiceClient('user');
    const { data: appeal } = await userClient.patch(`/internal/users/appeals/${appealId}/resolve`, {
        status,
        adminNotes,
        resolvedByAdminId: adminId
    });

    if (!appeal) throw new ApiError(404, 'Đơn kháng cáo không tồn tại');

    if (status === 'approved') {
        const userId = appeal.userId;
        // Xoá khỏi Redis blacklist
        await redis.del(`blacklist:banned:${userId}`);

        // Bắn event USER_UNBANNED
        await eventBus.publish(EventTypes.USER_UNBANNED, {
            userId: userId.toString()
        });
    }

    return appeal;
};

export default {
    getAllUsers,
    banUser,
    deleteUser,
    getAllReports,
    resolveReport,
    getDashboardStats,
    addBlacklistKeyword,
    getBlacklistKeywords,
    deleteBlacklistKeyword,
    checkContainsBlacklistKeyword,
    getAllAppeals,
    resolveAppeal
};
