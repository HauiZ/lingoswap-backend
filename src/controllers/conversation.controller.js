import conversationService from '../services/conversation.service.js';

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