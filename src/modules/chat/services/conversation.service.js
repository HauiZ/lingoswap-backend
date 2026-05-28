import Message from '../entities/Message.js';
import Conversation from '../entities/Conversation.js';
import presenceService from '../../presence/services/presence.service.js';
import { formatSpecificDate, getFriendlyTime } from '../../../core/utils/timeHelper.js';
import ApiError from '../../../core/utils/ApiError.js';

const getAllConversation = async (userId) => {
    const conversations = await Conversation.find({
        participants: userId,
        matchSessionId: null // Bỏ qua các chat từ các Match Session tạm thời
    })
        .populate('participants', 'profile.fullName profile.avatar email status lastOnlineAt')
        .populate('lastMessage', 'content createdAt')
        .sort({ updatedAt: -1 })
        .limit(20)
        .exec();

    const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
        const convObj = conv.toObject();
        const partner = convObj.participants.find(p => p._id.toString() !== userId.toString());

        if (partner) {
            // Check online qua RAM (PresenceManager) thay vì Redis
            partner.status = presenceService.isOnline(partner._id.toString()) ? 'online' : 'offline';

            partner.lastSeen = {
                full: formatSpecificDate(partner.lastOnlineAt),
                friendly: getFriendlyTime(partner.lastOnlineAt)
            };
        }

        return {
            _id: convObj._id,
            partner: partner,
            lastMessage: convObj.lastMessage ? {
                content: convObj.lastMessage.content,
                time: {
                    full: formatSpecificDate(convObj.lastMessage.createdAt),
                    friendly: getFriendlyTime(convObj.lastMessage.createdAt)
                }
            } : null,
            updatedAt: {
                full: formatSpecificDate(convObj.updatedAt),
                friendly: getFriendlyTime(convObj.updatedAt)
            }
        };
    }));

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
