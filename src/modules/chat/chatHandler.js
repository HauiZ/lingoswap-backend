import redis from '../../core/config/redis.js';
import { saveMessageService } from './chat.service.js';

export const handleChatProvider = (io, socket) => {

    socket.on('send_message', async ({ partnerId, content, matchSessionId, type = 'text' }) => {
        const senderId = socket.user._id;

        try {
            console.log(senderId, partnerId, content, matchSessionId, type);
            // Delegate database operations to the service layer
            const { messageData, newMessage } = await saveMessageService({
                senderId,
                partnerId,
                content,
                matchSessionId,
                type
            });

            const partnerSocketId = await redis.get(`socket:${partnerId}`);

            if (partnerSocketId) {
                io.to(partnerSocketId).emit('receive_message', messageData);
            }

            socket.emit('message_sent_success', newMessage);

        } catch (error) {
            console.error("Lỗi gửi tin nhắn (Lazy Create):", error);
            socket.emit('error', 'Không thể gửi tin nhắn');
        }
    });
};
