import Conversation from "../models/Conversation.js";
import Friendship from "../models/Friendship.js";
import { formatSpecificDate, getFriendlyTime } from '../utils/timeHelper.js';
import ApiError from '../utils/ApiError.js';
import User from "../models/User.js";
import notificationService from '../services/notification.service.js';

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
            fullName: partner.profile.fullName,
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

const sendFriendRequest = async (requesterId, recipientId, io) => {
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
        responseFriendRequest(requesterId, existingFriendship._id, "accept", io);
        return;
    }

    const friendship = new Friendship({
        requesterId,
        recipientId,
        status: 'pending'
    });

    await friendship.save();

    if (io) {
        try {
            const requester = await User.findById(requesterId).select('profile.fullName').lean();
            if (requester) {
                await notificationService.createAndPush(io, {
                    recipientId,
                    senderId: requesterId,
                    type: 'friend_request',
                    content: `${requester.profile.fullName} đã gửi cho bạn lời mời kết bạn.`,
                    metadata: { friendshipId: friendship._id }
                });
            }
        } catch (e) {
            console.error('Lỗi gửi thông báo kết bạn:', e.message);
        }
    }

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

const responseFriendRequest = async (userId, requestId, status, io) => {
    const friendship = await Friendship.findById(requestId).populate('requesterId', 'profile.fullName');
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

        if (io) {
            try {
                const acceptor = await User.findById(userId).select('profile.fullName').lean();
                if (acceptor) {
                    await notificationService.createAndPush(io, {
                        recipientId: friendship.requesterId,
                        senderId: userId,
                        type: 'friend_accepted',
                        content: `${acceptor.profile.fullName} đã chấp nhận lời mời kết bạn của bạn.`,
                        metadata: { friendshipId: friendship._id }
                    });

                    // Cập nhật lại thông báo yêu cầu kết bạn của bản thân thành đã chấp nhận
                    // Cập nhật lại thông báo yêu cầu kết bạn của bản thân thành đã chấp nhận
                    await notificationService.updateNotificationContent(
                        userId,
                        { type: 'friend_request', 'metadata.friendshipId': friendship._id },
                        {
                            type: 'responsed_friend_request',
                            content: `Bạn đã chấp nhận lời mời kết bạn từ ${friendship.requesterId.profile?.fullName || 'người dùng'}.`
                        }
                    );
                }
            } catch (e) {
                console.error('Lỗi gửi thông báo đồng ý kết bạn:', e.message);
            }
        }

        return 'Đã chấp nhận yêu cầu kết bạn';
    } else if (status === 'reject') {
        friendship.status = 'rejected';
        friendship.respondedAt = Date.now();
        await friendship.save();

        if (io) {
            try {
                const rejector = await User.findById(userId).select('profile.fullName').lean();
                if (rejector) {
                    await notificationService.createAndPush(io, {
                        recipientId: friendship.requesterId,
                        senderId: userId,
                        type: 'friend_rejected',
                        content: `${rejector.profile.fullName} đã từ chối lời mời kết bạn của bạn.`,
                        metadata: { friendshipId: friendship._id }
                    });

                    // Cập nhật lại thông báo yêu cầu kết bạn của bản thân thành đã từ chối
                    // Cập nhật lại thông báo yêu cầu kết bạn của bản thân thành đã từ chối
                    await notificationService.updateNotificationContent(
                        userId,
                        { type: 'friend_request', 'metadata.friendshipId': friendship._id },
                        {
                            type: 'responsed_friend_request',
                            content: `Bạn đã từ chối lời mời kết bạn từ ${friendship.requesterId.profile?.fullName || 'người dùng'}.`
                        }
                    );
                }
            } catch (e) {
                console.error('Lỗi gửi thông báo từ chối kết bạn:', e.message);
            }
        }

        return 'Đã từ chối yêu cầu kết bạn';
    } else {
        throw new ApiError(400, 'Trạng thái không hợp lệ');
    }
};

const removeFriend = async (userId, friendId, io) => {
    const friendship = await Friendship.findOneAndDelete({
        $or: [
            { requesterId: userId, recipientId: friendId, status: 'accepted' },
            { requesterId: friendId, recipientId: userId, status: 'accepted' }
        ]
    });

    if (!friendship) {
        throw new ApiError(404, 'Không tìm thấy quan hệ bạn bè này');
    }

    const conversations = await Conversation.findOne({
        participants: { $all: [userId, friendId] }
    });
    if (conversations) {
        conversations.isPermanent = false;
        await conversations.save();
    }

    if (io) {
        try {
            const remover = await User.findById(userId).select('profile.fullName').lean();
            if (remover) {
                await notificationService.createAndPush(io, {
                    recipientId: friendId,
                    senderId: userId,
                    type: 'friendship_ended',
                    content: `${remover.profile.fullName} đã hủy kết bạn với bạn.`,
                    metadata: { friendshipId: friendship._id }
                });
            }
        } catch (e) {
            console.error('Lỗi gửi thông báo hủy kết bạn:', e.message);
        }
    }

    return 'Đã hủy kết bạn';
};

export default {
    getListFriends,
    sendFriendRequest,
    getFriendRequests,
    responseFriendRequest,
    removeFriend
};
