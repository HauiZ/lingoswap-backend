import Notification from '../entities/Notification.js';
import eventBus from '../config/eventBus.js';
import { EventTypes } from '../events/eventTypes.js';
import { createServiceClient } from '../http/serviceClient.js';

/**
 * Tạo thông báo và push realtime qua Gateway Socket
 */
const createAndPush = async ({ recipientId, senderId, type, content, metadata }) => {
    const notification = await Notification.create({
        recipientId,
        senderId: senderId || null,
        type,
        content,
        metadata: metadata || {}
    });

    // Mock populate senderId bằng cách gọi User Service qua HTTP
    let sender = null;
    if (senderId) {
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.get(`/internal/users/${senderId}/basic`);
            sender = data;
        } catch (err) {
            console.error(`[Notification Service] Failed to fetch sender info for: ${senderId}`, err.message);
        }
    }

    const populated = {
        ...notification.toObject(),
        senderId: sender ? {
            _id: senderId,
            profile: sender.profile
        } : null
    };

    // Push realtime qua Socket thông qua Gateway
    try {
        await eventBus.publish(EventTypes.SOCKET_EMIT, {
            targetUserId: recipientId.toString(),
            event: 'new_notification',
            data: populated
        });
    } catch (err) {
        console.error('[Notification Service] Failed to publish SOCKET_EMIT event:', err.message);
    }

    return populated;
};

/**
 * Gửi thông báo tới tất cả Admin (khi có report mới)
 */
const notifyAllAdmins = async ({ senderId, type, content, metadata }) => {
    let admins = [];
    try {
        const userClient = createServiceClient('user');
        const { data } = await userClient.get('/internal/users?role=admin');
        admins = data || [];
    } catch (err) {
        console.error('[Notification Service] Failed to fetch admin list from User Service:', err.message);
    }

    const notifications = await Promise.all(
        admins.map(admin =>
            createAndPush({
                recipientId: admin._id,
                senderId,
                type,
                content,
                metadata
            })
        )
    );

    return notifications;
};

/**
 * Lấy danh sách thông báo cho user
 */
const getNotifications = async (userId, limit = 20, page = 1) => {
    const notifications = await Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

    // Mock populate sender info cho từng notification
    const populatedNotifications = await Promise.all(
        notifications.map(async (notif) => {
            if (!notif.senderId) return { ...notif, senderId: null };
            try {
                const userClient = createServiceClient('user');
                const { data } = await userClient.get(`/internal/users/${notif.senderId}/basic`);
                return {
                    ...notif,
                    senderId: data ? {
                        _id: notif.senderId,
                        profile: data.profile
                    } : null
                };
            } catch (err) {
                console.error(`[Notification Service] Failed to populate sender: ${notif.senderId}`, err.message);
                return { ...notif, senderId: null };
            }
        })
    );

    return populatedNotifications;
};

/**
 * Đếm số thông báo chưa đọc
 */
const countUnread = async (userId) => {
    return await Notification.countDocuments({ recipientId: userId, isRead: false });
};

/**
 * Đánh dấu đã đọc (1 hoặc tất cả)
 */
const markAsRead = async (userId, notificationId) => {
    if (notificationId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, recipientId: userId },
            { isRead: true },
            { new: true }
        );
    }
    // Đánh dấu tất cả
    return await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
    );
};

/**
 * Cập nhật nội dung của một thông báo cụ thể (VD: Lời mời kết bạn đã được xử lý)
 */
const updateNotificationContent = async (recipientId, metadataQuery, updateData) => {
    const query = { recipientId };
    if (metadataQuery.friendshipId) {
        query['metadata.friendshipId'] = metadataQuery.friendshipId;
    }
    if (metadataQuery.reportId) {
        query['metadata.reportId'] = metadataQuery.reportId;
    }

    return await Notification.findOneAndUpdate(
        query,
        { ...updateData, isRead: true },
        { new: true }
    );
};

export default {
    createAndPush,
    notifyAllAdmins,
    getNotifications,
    countUnread,
    markAsRead,
    updateNotificationContent
};
