import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import redis from '../config/redis.js';
import { formatSpecificDate, getFriendlyTime } from '../utils/formatDate.js';

const getAllConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ participants: userId })
            .populate('participants', 'profile.fullName profile.avatar email status lastOnlineAt')
            .populate('lastMessage', 'content createdAt')
            .sort({ updatedAt: -1 })
            .limit(20)
            .exec();

        const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
            const convObj = conv.toObject();
            const partner = convObj.participants.find(p => p._id.toString() !== userId.toString());

            if (partner) {
                const isOnline = await redis.get(`socket:${partner._id}`);
                partner.status = isOnline ? 'online' : 'offline';

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

        res.status(200).json(enrichedConversations);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy danh sách chat" });
    }
};

const getMessagesByConversation = async (req, res) => {
    const { conversationId } = req.params;
    const { limit = 20, page = 1 } = req.query; // Phân trang

    try {
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 }) // Lấy tin mới nhất trước
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        const formattedMessages = messages.map(msg => ({
            ...msg,
            createdAt: {
                full: formatSpecificDate(msg.createdAt),
                friendly: getFriendlyTime(msg.createdAt)
            }
        }));
        // Trả về danh sách đã đảo ngược lại để đúng thứ tự thời gian từ cũ đến mới
        res.status(200).json(formattedMessages.reverse());
    } catch (error) {
        res.status(500).json({ error: "Không thể lấy lịch sử tin nhắn" });
    }
};

export { getMessagesByConversation, getAllConversation };