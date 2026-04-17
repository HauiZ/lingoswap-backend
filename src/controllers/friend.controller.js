import friendService from '../services/friend.service.js';

const sendFriendRequest = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const requesterId = req.user.id;

        await friendService.sendFriendRequest(requesterId, recipientId);
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
        res.status(200).json({ message });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi phản hồi yêu cầu kết bạn' });
    }
}

export {
    sendFriendRequest,
    responseFriendRequest,
    getFriendRequests
}