import { EventTypes } from './eventTypes.js';
import { saveMessageService } from '../services/chat.service.js';
import Conversation from '../entities/Conversation.js';

export const registerEventHandlers = (eventBus) => {
    // 1. Lắng nghe event gửi tin nhắn từ Socket Gateway
    eventBus.subscribe('chat.send_message', async (payload) => {
        try {
            const { userId, partnerId, content, matchSessionId, type } = payload;
            console.log(`📩 [Chat Service] Handling chat.send_message from ${userId} to ${partnerId}`);

            const { messageData, newMessage } = await saveMessageService({
                senderId: userId,
                partnerId,
                content,
                matchSessionId,
                type: type || 'text'
            });

            // Gửi messageData tới partner qua Socket Gateway
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: partnerId.toString(),
                event: 'receive_message',
                data: messageData
            });

            // Gửi newMessage (xác nhận thành công) tới người gửi
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: userId.toString(),
                event: 'message_sent_success',
                data: newMessage
            });
        } catch (err) {
            console.error(`❌ [Chat Service] Lỗi xử lý chat.send_message:`, err.message);
            // Gửi thông báo lỗi cho người gửi
            if (payload.userId) {
                const errMsg = err.statusCode === 400 ? err.message : 'Không thể gửi tin nhắn';
                await eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: payload.userId.toString(),
                    event: 'error',
                    data: errMsg
                });
            }
        }
    });

    // 2. Lắng nghe MATCH_CREATED từ Match Service để tạo conversation tạm thời cho match session
    eventBus.subscribe(EventTypes.MATCH_CREATED, async (payload) => {
        try {
            const { sessionId, participants } = payload;
            console.log(`📩 [Chat Service] Handling MATCH_CREATED for session ${sessionId}`);

            if (!participants || !Array.isArray(participants)) {
                console.error('[Chat Service] MATCH_CREATED payload thiếu participants');
                return;
            }

            // Tạo conversation tạm thời (isPermanent = false)
            let conversation = await Conversation.findOne({ matchSessionId: sessionId });
            if (!conversation) {
                conversation = await Conversation.create({
                    participants,
                    matchSessionId: sessionId,
                    isPermanent: false
                });
                console.log(`✅ [Chat Service] Đã tạo cuộc hội thoại tạm thời cho Match Session: ${sessionId}`);
            }
        } catch (err) {
            console.error(`❌ [Chat Service] Lỗi xử lý MATCH_CREATED:`, err.message);
        }
    });
};

export default registerEventHandlers;
