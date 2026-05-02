import Notification from '../notifications/Notification.js';
import User from '../users/User.js';
import redis from '../../core/config/redis.js';

/**
 * Tạo thông báo và push realtime qua Socket nếu recipient đang online
 */
const createAndPush = async (io, { recipientId, senderId, type, content, metadata }) => {
    const notification = await Notification.create({
        recipientId,
        senderId: senderId || null,
        type,
        content,
        metadata: metadata || {}
    });

    // Populate sender info để Frontend hiển thị ngay
    const populated = await Notification.findById(notification._id)
        .populate('senderId', 'profile.fullName profile.avatar')
        .lean();

    // Push realtime qua Socket
    if (io) {
        const socketId = await redis.get(`socket:${recipientId}`);
        if (socketId) {
            io.to(socketId).emit('new_notification', populated);
        }
    }

    return populated;
};

/**
 * Gửi thông báo tới tất cả Admin (khi có report mới)
 */
const notifyAllAdmins = async (io, { senderId, type, content, metadata }) => {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();

    const notifications = await Promise.all(
        admins.map(admin =>
            createAndPush(io, {
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
    return await Notification.find({ recipientId: userId })
        .populate('senderId', 'profile.fullName profile.avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
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
    return await Notification.findOneAndUpdate(
        { recipientId, ...metadataQuery },
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
