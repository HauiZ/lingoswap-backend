// src/controllers/messageController.js
import Message from '../models/Message.js';

export const getMessagesByConversation = async (req, res) => {
    const { conversationId } = req.params;
    const { limit = 20, page = 1 } = req.query; // Phân trang

    try {
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 }) // Lấy tin mới nhất trước
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // Trả về danh sách đã đảo ngược lại để đúng thứ tự thời gian từ cũ đến mới
        res.status(200).json(messages.reverse());
    } catch (error) {
        res.status(500).json({ error: "Không thể lấy lịch sử tin nhắn" });
    }
};