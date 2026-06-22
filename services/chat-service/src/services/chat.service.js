import Message from '../entities/Message.js';
import Conversation from '../entities/Conversation.js';
import ApiError from '../utils/ApiError.js';
import { createServiceClient } from '../http/serviceClient.js';

export const saveMessageService = async ({ senderId, partnerId, content, matchSessionId, type = 'text' }) => {
    if (type === 'text') {
        try {
            const adminClient = createServiceClient('admin');
            const { data } = await adminClient.post('/internal/admin/blacklist/check', { text: content });
            if (data && data.hasKeyword) {
                throw new ApiError(400, 'Tin nhắn chứa từ ngữ không phù hợp');
            }
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            // Bỏ qua lỗi kiểm tra từ khoá nếu admin-service chưa khởi chạy hoặc gặp lỗi mạng (graceful degradation)
            console.warn('[Chat Service] Không thể kết nối tới Admin Service để kiểm tra từ khóa cấm:', error.message);
        }
    }

    let query = { participants: { $all: [senderId, partnerId] } };
    if (matchSessionId) {
        query.matchSessionId = matchSessionId;
    } else {
        query.matchSessionId = null;
    }

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [senderId, partnerId],
            matchSessionId: matchSessionId || null,
            isPermanent: !matchSessionId
        });
    }

    const newMessage = await Message.create({
        conversationId: conversation._id,
        senderId,
        content,
        type
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: newMessage._id,
        updatedAt: Date.now()
    });

    return {
        messageData: {
            ...newMessage.toObject(),
            conversationId: conversation._id
        },
        newMessage
    };
};

/**
 * Lưu tin nhắn kiểu hình ảnh vào DB sau khi đã upload lên Cloudinary
 */
export const saveImageMessageService = async ({ senderId, partnerId, imageUrl, matchSessionId }) => {
    let query = { participants: { $all: [senderId, partnerId] } };
    query.matchSessionId = matchSessionId || null;

    let conversation = await Conversation.findOne(query);
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [senderId, partnerId],
            matchSessionId: matchSessionId || null,
            isPermanent: !matchSessionId
        });
    }

    const newMessage = await Message.create({
        conversationId: conversation._id,
        senderId,
        content: imageUrl,   // lưu URL ảnh làm nội dung
        type: 'image'
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: newMessage._id,
        updatedAt: Date.now()
    });

    return {
        messageData: { ...newMessage.toObject(), conversationId: conversation._id },
        newMessage
    };
};
