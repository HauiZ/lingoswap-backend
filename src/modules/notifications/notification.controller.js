import notificationService from './notification.service.js';

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit, page } = req.query;
        const notifications = await notificationService.getNotifications(userId, limit, page);
        res.json(notifications);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi lấy thông báo' });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await notificationService.countUnread(userId);
        res.json({ unreadCount: count });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi đếm thông báo' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        await notificationService.markAsRead(userId, notificationId);
        res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi đánh dấu thông báo' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await notificationService.markAsRead(userId);
        res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi đánh dấu thông báo' });
    }
};

export { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
