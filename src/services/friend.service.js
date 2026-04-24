import Conversation from "../models/Conversation.js";
import Friendship from "../models/Friendship.js";
import { formatSpecificDate, getFriendlyTime } from '../utils/timeHelper.js';
import ApiError from '../utils/ApiError.js';
import User from "../models/User.js";

const getListFriends = async (userId) => {
    const friendships = await Friendship.find({
        $or: [
            { requesterId: userId, status: 'accepted' },
            { recipientId: userId, status: 'accepted' }
        ]
    }).populate('requesterId', '_id profile email status lastOnlineAt').populate('recipientId', '_id profile email status lastOnlineAt');

    const listFriends = friendships.map(friendship => {
        const partner = friendship.requesterId._id.toString() === userId.toString() ? friendship.recipientId : friendship.requesterId;
        return {
            _id: partner._id,
            username: partner.profile.fullName,
            avatar: partner.profile.avatar,
            email: partner.email,
            status: partner.status,
            lastOnlineAt: {
                full: formatSpecificDate(partner.lastOnlineAt),
                friendly: getFriendlyTime(partner.lastOnlineAt)
            }
        };
    });
    return listFriends;
};

const sendFriendRequest = async (requesterId, recipientId) => {
    if (requesterId === recipientId) {
        throw new ApiError(400, 'Không thể gửi yêu cầu kết bạn cho chính mình');
    }

    const existingFriendship = await Friendship.findOne({
        $or: [
            { requesterId, recipientId },
            { requesterId: recipientId, recipientId: requesterId }
        ]
    });

    if (existingFriendship) {
        responseFriendRequest(requesterId, existingFriendship._id, "accept");
        return;
    }

    const friendship = new Friendship({
        requesterId,
        recipientId,
        status: 'pending'
    });

    await friendship.save();
    return friendship;
};

const getFriendRequests = async (userId) => {
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
    return listFriendRequests;
};

const responseFriendRequest = async (userId, requestId, status) => {
    const friendship = await Friendship.findById(requestId);
    if (!friendship) {
        throw new ApiError(404, 'Không tìm thấy yêu cầu kết bạn');
    }

    if (friendship.recipientId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Không có quyền thực hiện hành động này');
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
        return 'Đã chấp nhận yêu cầu kết bạn';
    } else if (status === 'reject') {
        friendship.status = 'rejected';
        friendship.respondedAt = Date.now();
        await friendship.save();
        return 'Đã từ chối yêu cầu kết bạn';
    } else {
        throw new ApiError(400, 'Trạng thái không hợp lệ');
    }
};

export default {
    getListFriends,
    sendFriendRequest,
    getFriendRequests,
    responseFriendRequest
};
