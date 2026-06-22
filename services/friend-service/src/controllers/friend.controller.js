import friendService from '../services/friend.service.js';
import { createServiceClient } from '../http/serviceClient.js';

const getListFriends = async (req, res) => {
    try {
        const userId = req.user.id;
        const listFriends = await friendService.getListFriends(userId);
        res.status(200).json(listFriends);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy danh sách bạn bè' });
    }
};

const sendFriendRequest = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const requesterId = req.user.id;
        await friendService.sendFriendRequest(requesterId, recipientId);

        res.status(201).json({ message: 'Đã gửi yêu cầu kết bạn' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi gửi yêu cầu kết bạn' });
    }
};

const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const listFriendRequests = await friendService.getFriendRequests(userId);
        res.status(200).json(listFriendRequests);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy danh sách yêu cầu kết bạn' });
    }
};

const responseFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const message = await friendService.responseFriendRequest(userId, requestId, status);

        res.status(200).json({ message });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi phản hồi yêu cầu kết bạn' });
    }
};

const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.id;

        const message = await friendService.removeFriend(userId, friendId);
        res.status(200).json({ message });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi hủy kết bạn' });
    }
};

const checkFriendStatus = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const userId = req.user.id;
        
        const result = await friendService.checkFriendshipStatus(userId, targetUserId);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi kiểm tra trạng thái bạn bè' });
    }
};

const getOnlineFriends = async (req, res) => {
    try {
        const userId = req.user.id;
        const presenceClient = createServiceClient('presence');
        const { data } = await presenceClient.get(`/internal/presence/${userId}/friends/online`);
        const onlineFriendIds = data.friendIds || data || [];
        res.status(200).json({ onlineFriendIds });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Lỗi khi lấy danh sách bạn bè online' });
    }
};

export {
    getListFriends,
    sendFriendRequest,
    responseFriendRequest,
    getFriendRequests,
    removeFriend,
    checkFriendStatus,
    getOnlineFriends
};
