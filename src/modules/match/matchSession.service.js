import MatchSession from './MatchSession.js';
import Conversation from '../chat/Conversation.js';
import UserReview from '../users/UserReview.js';
import conversationService from '../chat/conversation.service.js';
import ApiError from '../../core/utils/ApiError.js';

const getMatchHistory = async (userId, limit = 20, page = 1) => {
    // Chỉ lấy các cuộc gọi đã kết nối thành công hoặc bị huỷ nhưng có thời lượng > 0
    const sessions = await MatchSession.find({
        participants: userId,
        status: { $in: ['completed', 'cancelled'] },
        durationSeconds: { $gt: 0 }
    })
        .populate('participants', 'profile.fullName profile.avatar email username')
        .sort({ startedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

    const sessionIds = sessions.map(s => s._id);
    const conversations = await Conversation.find({ matchSessionId: { $in: sessionIds } }).lean();
    const reviews = await UserReview.find({ matchSessionId: { $in: sessionIds } }).lean();

    const formattedSessions = sessions.map(session => {
        const partner = session.participants.find(p => p._id.toString() !== userId.toString());
        const conversation = conversations.find(c => c.matchSessionId?.toString() === session._id.toString());
        const myReview = reviews.find(r => r.matchSessionId.toString() === session._id.toString() && r.reviewerId.toString() === userId.toString());

        return {
            ...session,
            conversationId: conversation ? conversation._id : null,
            partner,
            myReview: myReview || null
        };
    });

    return formattedSessions;
};

const getMatchSessionDetails = async (sessionId, userId) => {
    const session = await MatchSession.findById(sessionId)
        .populate('participants', 'profile.fullName profile.avatar email username')
        .lean();

    if (!session) {
        throw new Error('Phiên gọi không tồn tại.');
    }

    // Xác nhận user có trong phiên này
    if (!session.participants.some(p => p._id.toString() === userId.toString())) {
        throw new Error('Không có quyền truy cập phiên này.');
    }

    const partner = session.participants.find(p => p._id.toString() !== userId.toString());
    const conversation = await Conversation.findOne({ matchSessionId: sessionId }).lean();

    let messages = [];
    if (conversation) {
        messages = await conversationService.getMessagesByConversation(conversation._id, 100, 1);
    }

    const reviews = await UserReview.find({ matchSessionId: sessionId }).lean();
    const myReview = reviews.find(r => r.reviewerId.toString() === userId.toString());

    return {
        ...session,
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

    // Kiểm tra xem đã review chưa
    const existingReview = await UserReview.findOne({ reviewerId, matchSessionId: sessionId });
    if (existingReview) {
        throw new ApiError(400, 'Bạn đã đánh giá phiên gọi này rồi.');
    }

    const review = await UserReview.create({
        reviewerId,
        targetUserId,
        matchSessionId: sessionId,
        rating,
        comment
    });

    return review;
};

export default {
    getMatchHistory,
    getMatchSessionDetails,
    createReview
};
