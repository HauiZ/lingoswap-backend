import MatchSession from '../models/MatchSession.js';
import Conversation from '../models/Conversation.js';
import conversationService from './conversation.service.js';

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

    const formattedSessions = sessions.map(session => {
        const partner = session.participants.find(p => p._id.toString() !== userId.toString());
        const conversation = conversations.find(c => c.matchSessionId?.toString() === session._id.toString());
        
        return {
            ...session,
            conversationId: conversation ? conversation._id : null,
            partner
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

    return {
        ...session,
        conversationId: conversation ? conversation._id : null,
        partner,
        messages
    };
};

export default {
    getMatchHistory,
    getMatchSessionDetails
};
