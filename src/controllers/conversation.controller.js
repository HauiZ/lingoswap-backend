import conversationService from '../services/conversation.service.js';
import { saveImageMessageService } from '../services/chat.service.js';
import redis from '../config/redis.js';

const getAllConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const enrichedConversations = await conversationService.getAllConversation(userId);
        res.status(200).json(enrichedConversations);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi lấy danh sách chat" });
    }
};

const getMessagesByConversation = async (req, res) => {
    const { conversationId } = req.params;
    const { limit, page } = req.query;

    try {
        const formattedMessages = await conversationService.getMessagesByConversation(conversationId, limit, page);
        res.status(200).json(formattedMessages);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Không thể lấy lịch sử tin nhắn" });
    }
};

export { getMessagesByConversation, getAllConversation };

export const sendImageMessage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file nào được upload' });
        }

        const senderId = req.user.id;
        const { partnerId, matchSessionId } = req.body;

        if (!partnerId) {
            return res.status(400).json({ error: 'Thiếu thông tin người nhận (partnerId)' });
        }

        const imageUrl = req.file.path;

        const { messageData } = await saveImageMessageService({
            senderId,
            partnerId,
            imageUrl,
            matchSessionId: matchSessionId || null
        });

        // Broadcast tới partner nếu đang online qua Socket
        const io = req.app.get('io');
        const partnerSocketId = await redis.get(`socket:${partnerId}`);
        if (io && partnerSocketId) {
            io.to(partnerSocketId).emit('receive_message', messageData);
        }

        res.status(201).json(messageData);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi gửi ảnh' });
    }
};