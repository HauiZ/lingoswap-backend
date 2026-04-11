import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import redis from '../config/redis.js';

export const handleChatProvider = (io, socket) => {

    socket.on('send_message', async ({ partnerId, content, matchSessionId, type = 'text' }) => {
        const senderId = socket.user._id;

        try {
            console.log(senderId, partnerId, content, matchSessionId, type);
            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, partnerId] }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, partnerId],
                    matchSessionId: matchSessionId || null,
                    isPermanent: false
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

            const partnerSocketId = await redis.get(`socket:${partnerId}`);

            if (partnerSocketId) {
                io.to(partnerSocketId).emit('receive_message', {
                    ...newMessage.toObject(),
                    conversationId: conversation._id
                });
            }

            socket.emit('message_sent_success', newMessage);

        } catch (error) {
            console.error("Lỗi gửi tin nhắn (Lazy Create):", error);
            socket.emit('error', 'Không thể gửi tin nhắn');
        }
    });
};