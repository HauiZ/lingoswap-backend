import { EventTypes } from './eventTypes.js';
import notificationService from '../services/notification.service.js';

export const registerEventHandlers = (eventBus) => {
    // 1. Generic notification push event
    eventBus.subscribe(EventTypes.NOTIFICATION_PUSH, async (payload) => {
        try {
            console.log(`📩 [Notification Service] Handling NOTIFICATION_PUSH`);
            await notificationService.createAndPush(payload);
        } catch (err) {
            console.error(`❌ [Notification Service] Error in NOTIFICATION_PUSH handler:`, err.message);
        }
    });

    // 2. Friend request sent event
    eventBus.subscribe(EventTypes.FRIEND_REQUEST_SENT, async (payload) => {
        try {
            const { requesterId, recipientId, friendshipId, requesterName } = payload;
            console.log(`📩 [Notification Service] Handling FRIEND_REQUEST_SENT from ${requesterId} to ${recipientId}`);
            
            await notificationService.createAndPush({
                recipientId,
                senderId: requesterId,
                type: 'friend_request',
                content: `${requesterName || 'Ai đó'} đã gửi cho bạn lời mời kết bạn.`,
                metadata: { friendshipId }
            });
        } catch (err) {
            console.error(`❌ [Notification Service] Error in FRIEND_REQUEST_SENT handler:`, err.message);
        }
    });

    // 3. Friend request accepted event
    eventBus.subscribe(EventTypes.FRIEND_REQUEST_ACCEPTED, async (payload) => {
        try {
            const { requesterId, recipientId, friendshipId, requesterName, recipientName } = payload;
            console.log(`📩 [Notification Service] Handling FRIEND_REQUEST_ACCEPTED between ${requesterId} and ${recipientId}`);
            
            // Notify requester that the recipient accepted
            await notificationService.createAndPush({
                recipientId: requesterId,
                senderId: recipientId,
                type: 'friend_accepted',
                content: `${recipientName || 'Ai đó'} đã chấp nhận lời mời kết bạn của bạn.`,
                metadata: { friendshipId }
            });

            // Update local notification status for recipient to read and change description
            await notificationService.updateNotificationContent(
                recipientId,
                { friendshipId },
                { content: `Bạn đã chấp nhận lời mời kết bạn của ${requesterName || 'người này'}.` }
            );
        } catch (err) {
            console.error(`❌ [Notification Service] Error in FRIEND_REQUEST_ACCEPTED handler:`, err.message);
        }
    });

    // 4. Friend request rejected event
    eventBus.subscribe(EventTypes.FRIEND_REQUEST_REJECTED, async (payload) => {
        try {
            const { requesterId, recipientId, friendshipId, requesterName } = payload;
            console.log(`📩 [Notification Service] Handling FRIEND_REQUEST_REJECTED from ${requesterId} to ${recipientId}`);

            // Update local notification status for recipient to read and change description
            await notificationService.updateNotificationContent(
                recipientId,
                { friendshipId },
                { content: `Bạn đã từ chối lời mời kết bạn của ${requesterName || 'người này'}.` }
            );
        } catch (err) {
            console.error(`❌ [Notification Service] Error in FRIEND_REQUEST_REJECTED handler:`, err.message);
        }
    });

    // 5. New report created event
    eventBus.subscribe(EventTypes.REPORT_CREATED, async (payload) => {
        try {
            const { reportId, reporterId, targetUserId, reason } = payload;
            console.log(`📩 [Notification Service] Handling REPORT_CREATED for target: ${targetUserId}`);

            await notificationService.notifyAllAdmins({
                senderId: reporterId,
                type: 'report_new',
                content: `Có báo cáo vi phạm mới đối với người dùng ID: ${targetUserId}. Lý do: ${reason}`,
                metadata: { reportId }
            });
        } catch (err) {
            console.error(`❌ [Notification Service] Error in REPORT_CREATED handler:`, err.message);
        }
    });

    // 6. Report resolved event
    eventBus.subscribe(EventTypes.REPORT_RESOLVED, async (payload) => {
        try {
            const { reportId, reporterId, adminNotes } = payload;
            console.log(`📩 [Notification Service] Handling REPORT_RESOLVED for report: ${reportId}`);

            await notificationService.createAndPush({
                recipientId: reporterId,
                type: 'report_handled',
                content: `Báo cáo của bạn (Mã: ${reportId}) đã được xử lý: ${adminNotes || 'Đã giải quyết.'}`,
                metadata: { reportId }
            });
        } catch (err) {
            console.error(`❌ [Notification Service] Error in REPORT_RESOLVED handler:`, err.message);
        }
    });

    // 7. User account banned event
    eventBus.subscribe(EventTypes.USER_BANNED, async (payload) => {
        try {
            const { userId, reason } = payload;
            console.log(`📩 [Notification Service] Handling USER_BANNED for user: ${userId}`);

            await notificationService.createAndPush({
                recipientId: userId,
                type: 'account_banned',
                content: `Tài khoản của bạn đã bị khóa. Lý do: ${reason || 'Vi phạm điều khoản cộng đồng.'}`
            });
        } catch (err) {
            console.error(`❌ [Notification Service] Error in USER_BANNED handler:`, err.message);
        }
    });

    // 8. User account unbanned event
    eventBus.subscribe(EventTypes.USER_UNBANNED, async (payload) => {
        try {
            const { userId } = payload;
            console.log(`📩 [Notification Service] Handling USER_UNBANNED for user: ${userId}`);

            await notificationService.createAndPush({
                recipientId: userId,
                type: 'account_unbanned',
                content: `Tài khoản của bạn đã được mở khóa. Chào mừng bạn quay trở lại!`
            });
        } catch (err) {
            console.error(`❌ [Notification Service] Error in USER_UNBANNED handler:`, err.message);
        }
    });
};

export default registerEventHandlers;
