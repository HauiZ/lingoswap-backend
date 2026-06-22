import Message from '../entities/Message.js';
import Conversation from '../entities/Conversation.js';
import { formatSpecificDate, getFriendlyTime } from '../utils/timeHelper.js';
import ApiError from '../utils/ApiError.js';
import { createServiceClient } from '../http/serviceClient.js';

const getAllConversation = async (userId) => {
    const conversations = await Conversation.find({
        participants: userId,
        matchSessionId: null // Bỏ qua các chat từ các Match Session tạm thời
    })
        .populate('lastMessage', 'content createdAt')
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean()
        .exec();

    const partnerIds = conversations.map(conv => {
        const partner = conv.participants.find(p => p.toString() !== userId.toString());
        return partner ? partner.toString() : null;
    }).filter(Boolean);

    // Fetch partner user profiles in bulk
    let partnersMap = {};
    if (partnerIds.length > 0) {
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.post('/internal/users/bulk', { userIds: partnerIds });
            if (data && Array.isArray(data)) {
                data.forEach(user => {
                    partnersMap[user._id.toString()] = user;
                });
            }
        } catch (err) {
            console.error('[Chat Service] Failed to fetch partner profiles in bulk:', err.message);
        }
    }

    // Fetch presence status in bulk
    let presenceMap = {};
    if (partnerIds.length > 0) {
        try {
            const presenceClient = createServiceClient('presence');
            const { data } = await presenceClient.post('/internal/presence/status/bulk', { userIds: partnerIds });
            presenceMap = data || {};
        } catch (err) {
            console.error('[Chat Service] Failed to fetch presence status in bulk:', err.message);
        }
    }

    const enrichedConversations = conversations.map((conv) => {
        const partnerId = conv.participants.find(p => p.toString() !== userId.toString());
        const partnerInfo = partnerId ? partnersMap[partnerId.toString()] : null;

        let partner = null;
        if (partnerInfo) {
            partner = {
                _id: partnerInfo._id,
                profile: partnerInfo.profile,
                email: partnerInfo.email,
                status: !!presenceMap[partnerId.toString()] ? 'online' : 'offline',
                lastOnlineAt: partnerInfo.lastOnlineAt,
                lastSeen: {
                    full: formatSpecificDate(partnerInfo.lastOnlineAt),
                    friendly: getFriendlyTime(partnerInfo.lastOnlineAt)
                }
            };
        }

        return {
            _id: conv._id,
            partner: partner,
            lastMessage: conv.lastMessage ? {
                content: conv.lastMessage.content,
                time: {
                    full: formatSpecificDate(conv.lastMessage.createdAt),
                    friendly: getFriendlyTime(conv.lastMessage.createdAt)
                }
            } : null,
            updatedAt: {
                full: formatSpecificDate(conv.updatedAt),
                friendly: getFriendlyTime(conv.updatedAt)
            }
        };
    });

    return enrichedConversations;
};

const getMessagesByConversation = async (conversationId, limit = 20, page = 1) => {
    const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

    const formattedMessages = messages.map(msg => ({
        ...msg.toObject(),
        createdAt: {
            full: formatSpecificDate(msg.createdAt),
            friendly: getFriendlyTime(msg.createdAt)
        }
    }));

    return formattedMessages.reverse();
};

export default {
    getAllConversation,
    getMessagesByConversation
};
