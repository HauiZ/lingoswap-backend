import Conversation from "../models/Conversation.js";
import Friendship from "../models/Friendship.js";
import { formatSpecificDate, getFriendlyTime } from '../utils/timeHelper.js';

const sendFriendRequest = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const requesterId = req.user.id;

        if (requesterId === recipientId) {
            return res.status(400).json({ error: 'Không thể gửi yêu cầu kết bạn cho chính mình' });
        }

        const existingFriendship = await Friendship.findOne({
            $or: [
                { requesterId, recipientId },
                { requesterId: recipientId, recipientId: requesterId }
            ]
        });

        if (existingFriendship) {
            return res.status(400).json({ error: 'Đã tồn tại mối quan hệ với người này' });
        }

        const friendship = new Friendship({
            requesterId,
            recipientId,
            status: 'pending'
        });

        await friendship.save();
        res.status(201).json({ message: 'Đã gửi yêu cầu kết bạn' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi gửi yêu cầu kết bạn' });
    }
}

const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendRequests = await Friendship.find({
            recipientId: userId,
            status: 'pending'
        }).populate('requesterId', '_id username avatar email').sort({ sentAt: -1 });
        const listFriendRequests = friendRequests.map(friendRequest => ({
            _id: friendRequest._id,
            partner: friendRequest.requesterId,
            sentAt: {
                full: formatSpecificDate(friendRequest.sentAt),
                friendly: getFriendlyTime(friendRequest.sentAt)
            }
        }));
        res.status(200).json(listFriendRequests);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách yêu cầu kết bạn' });
    }
}

const responseFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const friendship = await Friendship.findById(requestId);
        if (!friendship) {
            return res.status(404).json({ error: 'Không tìm thấy yêu cầu kết bạn' });
        }

        if (friendship.recipientId !== userId) {
            return res.status(403).json({ error: 'Không có quyền thực hiện hành động này' });
        }

        if (status === 'accept') {
            friendship.status = 'accepted';
            friendship.respondedAt = Date.now();
            await friendship.save();
            const conversations = await Conversation.findOne({
                participants: {
                    $all: [friendship.requesterId, friendship.recipientId]
                }
            });
            if (conversations && !conversations.isPermanent) {
                conversations.isPermanent = true;
                await conversations.save();
            }
            res.status(200).json({ message: 'Đã chấp nhận yêu cầu kết bạn' });
        } else if (status === 'reject') {
            friendship.status = 'rejected';
            friendship.respondedAt = Date.now();
            await friendship.save();
            res.status(200).json({ message: 'Đã từ chối yêu cầu kết bạn' });
        } else {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi phản hồi yêu cầu kết bạn' });
    }
}

export {
    sendFriendRequest,
    responseFriendRequest,
    getFriendRequests
}