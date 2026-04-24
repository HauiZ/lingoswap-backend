import friendService from '../services/friend.service.js';
import notificationService from '../services/notification.service.js';
import User from '../models/User.js';

const getListFriends = async (req, res) => {
    try {
        const userId = req.user.id;
        const listFriends = await friendService.getListFriends(userId);
        res.status(200).json(listFriends);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy danh sách bạn bè' });
    }
}

const sendFriendRequest = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const requesterId = req.user.id;

        const result = await friendService.sendFriendRequest(requesterId, recipientId);

        // Gửi thông báo cho người nhận lời mời
        if (result) {
            const requester = await User.findById(requesterId).select('profile.fullName').lean();
            const io = req.app.get('io');
            await notificationService.createAndPush(io, {
                recipientId,
                senderId: requesterId,
                type: 'friend_request',
                content: `${requester.profile.fullName} đã gửi cho bạn lời mời kết bạn.`,
                metadata: { friendshipId: result._id }
            });
        }

        res.status(201).json({ message: 'Đã gửi yêu cầu kết bạn' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi gửi yêu cầu kết bạn' });
    }
}

const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const listFriendRequests = await friendService.getFriendRequests(userId);
        res.status(200).json(listFriendRequests);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy danh sách yêu cầu kết bạn' });
    }
}

const responseFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const message = await friendService.responseFriendRequest(userId, requestId, status);

        // Nếu chấp nhận -> thông báo cho người gửi lời mời biết
        if (status === 'accept') {
            const Friendship = (await import('../models/Friendship.js')).default;
            const friendship = await Friendship.findById(requestId).lean();
            if (friendship) {
                const acceptor = await User.findById(userId).select('profile.fullName').lean();
                const io = req.app.get('io');
                await notificationService.createAndPush(io, {
                    recipientId: friendship.requesterId,
                    senderId: userId,
                    type: 'friend_accepted',
                    content: `${acceptor.profile.fullName} đã chấp nhận lời mời kết bạn của bạn.`,
                    metadata: { friendshipId: friendship._id }
                });
            }
        }

        res.status(200).json({ message });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi phản hồi yêu cầu kết bạn' });
    }
}

export {
    getListFriends,
    sendFriendRequest,
    responseFriendRequest,
    getFriendRequests
}