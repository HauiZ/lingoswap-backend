import Message from '../entities/Message.js';
import Conversation from '../entities/Conversation.js';
import adminService from '../../admin/services/admin.service.js';
import ApiError from '../../../core/utils/ApiError.js';

export const saveMessageService = async ({ senderId, partnerId, content, matchSessionId, type = 'text' }) => {
    if (type === 'text') {
        const checkResult = await adminService.checkContainsBlacklistKeyword(content);
        if (checkResult.hasKeyword) {
            throw new ApiError(400, 'Tin nhắn chứa từ ngữ không phù hợp');
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
 * imageUrl: được Cloudinary trả về từ middleware multer
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
