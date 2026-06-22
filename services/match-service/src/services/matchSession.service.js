import MatchSession from '../entities/MatchSession.js';
import ApiError from '../utils/ApiError.js';
import { createServiceClient } from '../http/serviceClient.js';

const getMatchHistory = async (userId, limit = 20, page = 1) => {
    // Chỉ lấy các cuộc gọi đã kết nối thành công hoặc bị huỷ nhưng có thời lượng > 0
    const sessions = await MatchSession.find({
        participants: userId,
        status: { $in: ['completed', 'cancelled'] },
        durationSeconds: { $gt: 0 }
    })
        .sort({ startedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

    const sessionIds = sessions.map(s => s._id.toString());
    const participantIds = Array.from(new Set(sessions.flatMap(s => s.participants.map(p => p.toString()))));

    // Fetch user profiles in bulk from User Service
    let usersMap = {};
    if (participantIds.length > 0) {
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.post('/internal/users/bulk', { userIds: participantIds });
            if (data && Array.isArray(data)) {
                data.forEach(user => {
                    usersMap[user._id.toString()] = user;
                });
            }
        } catch (err) {
            console.error('[Match Service] Failed to fetch users for history:', err.message);
        }
    }

    // Fetch conversations in bulk from Chat Service
    let conversations = [];
    if (sessionIds.length > 0) {
        try {
            const chatClient = createServiceClient('chat');
            const { data } = await chatClient.post('/internal/conversations/by-match-sessions', { matchSessionIds: sessionIds });
            conversations = data || [];
        } catch (err) {
            console.error('[Match Service] Failed to fetch conversations for history:', err.message);
        }
    }

    // Fetch reviews in bulk from User Service
    let reviews = [];
    if (sessionIds.length > 0) {
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.post('/internal/users/reviews/bulk', { matchSessionIds: sessionIds });
            reviews = data || [];
        } catch (err) {
            console.error('[Match Service] Failed to fetch reviews for history:', err.message);
        }
    }

    const formattedSessions = sessions.map(session => {
        const partnerId = session.participants.find(p => p.toString() !== userId.toString());
        const partner = partnerId ? usersMap[partnerId.toString()] : null;
        
        const conversation = conversations.find(c => c.matchSessionId?.toString() === session._id.toString());
        const myReview = reviews.find(r => r.matchSessionId.toString() === session._id.toString() && r.reviewerId.toString() === userId.toString());

        // Map participants detail objects for backward compatibility
        const enrichedParticipants = session.participants.map(pId => usersMap[pId.toString()]).filter(Boolean);

        return {
            ...session,
            participants: enrichedParticipants,
            conversationId: conversation ? conversation._id : null,
            partner,
            myReview: myReview || null
        };
    });

    return formattedSessions;
};

const getMatchSessionDetails = async (sessionId, userId) => {
    const session = await MatchSession.findById(sessionId).lean();

    if (!session) {
        throw new ApiError(404, 'Phiên gọi không tồn tại.');
    }

    // Xác nhận user có trong phiên này
    if (!session.participants.some(p => p.toString() === userId.toString())) {
        throw new ApiError(403, 'Không có quyền truy cập phiên này.');
    }

    const partnerId = session.participants.find(p => p.toString() !== userId.toString());
    const participantIds = session.participants.map(p => p.toString());

    // Fetch user profiles in bulk
    let usersMap = {};
    try {
        const userClient = createServiceClient('user');
        const { data } = await userClient.post('/internal/users/bulk', { userIds: participantIds });
        if (data && Array.isArray(data)) {
            data.forEach(user => {
                usersMap[user._id.toString()] = user;
            });
        }
    } catch (err) {
        console.error('[Match Service] Failed to fetch users for session details:', err.message);
    }

    const partner = partnerId ? usersMap[partnerId.toString()] : null;
    const enrichedParticipants = session.participants.map(pId => usersMap[pId.toString()]).filter(Boolean);

    // Fetch conversation from Chat Service
    let conversation = null;
    try {
        const chatClient = createServiceClient('chat');
        const { data } = await chatClient.get(`/internal/conversations/by-match-session/${sessionId}`);
        conversation = data;
    } catch (err) {
        console.warn('[Match Service] No conversation found for session:', sessionId);
    }

    // Fetch messages from Chat Service if conversation exists
    let messages = [];
    if (conversation && conversation._id) {
        try {
            const chatClient = createServiceClient('chat');
            const { data } = await chatClient.get(`/internal/conversations/${conversation._id}/messages?limit=100`);
            messages = data || [];
        } catch (err) {
            console.error('[Match Service] Failed to fetch messages for conversation:', conversation._id, err.message);
        }
    }

    // Fetch reviews from User Service
    let reviews = [];
    try {
        const userClient = createServiceClient('user');
        const { data } = await userClient.get(`/internal/users/reviews/session/${sessionId}`);
        reviews = data || [];
    } catch (err) {
        console.error('[Match Service] Failed to fetch reviews for session details:', err.message);
    }

    const myReview = reviews.find(r => r.reviewerId.toString() === userId.toString());

    return {
        ...session,
        participants: enrichedParticipants,
        conversationId: conversation ? conversation._id : null,
        partner,
        messages,
        myReview: myReview || null
    };
};

const createReview = async (reviewerId, sessionId, payload) => {
    const { rating, comment } = payload;

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, 'Đánh giá phải từ 1 đến 5 sao.');
    }

    const session = await MatchSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, 'Phiên gọi không tồn tại.');
    }

    // Kiểm tra reviewerId có trong session này không
    const isParticipant = session.participants.some(p => p.toString() === reviewerId.toString());
    if (!isParticipant) {
        throw new ApiError(403, 'Bạn không có quyền đánh giá phiên gọi này.');
    }

    // Tìm đối phương
    const targetUserId = session.participants.find(p => p.toString() !== reviewerId.toString());
    if (!targetUserId) {
        throw new ApiError(400, 'Không tìm thấy đối phương trong phiên gọi này.');
    }

    // Kiểm tra xem đã review chưa qua User Service
    const userClient = createServiceClient('user');
    let existingReview = null;
    try {
        const { data } = await userClient.get(`/internal/users/reviews/check?reviewerId=${reviewerId}&matchSessionId=${sessionId}`);
        existingReview = data;
    } catch (err) {
        console.error('[Match Service] Failed to check existing review:', err.message);
    }

    if (existingReview) {
        throw new ApiError(400, 'Bạn đã đánh giá phiên gọi này rồi.');
    }

    // Tạo review mới bên User Service
    let review = null;
    try {
        const { data } = await userClient.post('/internal/users/reviews', {
            reviewerId,
            targetUserId: targetUserId.toString(),
            matchSessionId: sessionId,
            rating,
            comment
        });
        review = data;
    } catch (err) {
        console.error('[Match Service] Failed to create review:', err.message);
        throw new ApiError(500, 'Không thể lưu đánh giá của bạn.');
    }

    return review;
};

export default {
    getMatchHistory,
    getMatchSessionDetails,
    createReview
};
