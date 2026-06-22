import Friendship from '../entities/Friendship.js';
import { formatSpecificDate, getFriendlyTime } from '../utils/timeHelper.js';
import ApiError from '../utils/ApiError.js';
import eventBus from '../config/eventBus.js';
import { EventTypes } from '../events/eventTypes.js';
import { createServiceClient } from '../http/serviceClient.js';

const getListFriends = async (userId) => {
    const friendships = await Friendship.find({
        $or: [
            { requesterId: userId, status: 'accepted' },
            { recipientId: userId, status: 'accepted' }
        ]
    });

    const partnerIds = friendships.map(f =>
        f.requesterId.toString() === userId.toString() ? f.recipientId.toString() : f.requesterId.toString()
    );

    // Fetch friend profiles bulk
    let partnersMap = {};
    if (partnerIds.length > 0) {
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.post('/internal/users/bulk', { userIds: partnerIds });
            data.forEach(user => {
                partnersMap[user._id.toString()] = user;
            });
        } catch (err) {
            console.error('[Friend Service] Failed to fetch bulk user profiles:', err.message);
        }
    }

    // Fetch presence status bulk
    let presenceMap = {};
    if (partnerIds.length > 0) {
        try {
            const presenceClient = createServiceClient('presence');
            const { data } = await presenceClient.post('/internal/presence/status/bulk', { userIds: partnerIds });
            presenceMap = data || {};
        } catch (err) {
            console.error('[Friend Service] Failed to fetch bulk presence status:', err.message);
        }
    }

    // Fetch conversations to get conversationIds
    let conversations = [];
    try {
        const chatClient = createServiceClient('chat');
        const { data } = await chatClient.get(`/internal/conversations/direct/${userId}`);
        conversations = data || [];
    } catch (err) {
        console.error('[Friend Service] Failed to fetch direct conversations:', err.message);
    }

    const listFriends = friendships.map(friendship => {
        const partnerId = friendship.requesterId.toString() === userId.toString() ? friendship.recipientId.toString() : friendship.requesterId.toString();
        const partner = partnersMap[partnerId];
        if (!partner) return null;

        const conversation = conversations.find(conv =>
            conv.participants?.some(p => p.toString() === partnerId)
        );

        return {
            _id: partner._id,
            conversationId: conversation ? conversation._id : null,
            fullName: partner.profile?.fullName,
            avatar: partner.profile?.avatar,
            email: partner.email,
            status: !!presenceMap[partnerId] ? 'online' : 'offline',
            lastOnlineAt: {
                full: formatSpecificDate(partner.lastOnlineAt),
                friendly: getFriendlyTime(partner.lastOnlineAt)
            }
        };
    }).filter(Boolean);

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

    if (existingFriendship && existingFriendship.status === 'pending') {
        if (existingFriendship.recipientId.toString() === requesterId.toString()) {
            await responseFriendRequest(requesterId, existingFriendship._id, "accept");
            return existingFriendship;
        }
        throw new ApiError(400, 'Yêu cầu kết bạn đã được gửi trước đó và đang chờ xử lý');
    }

    if (existingFriendship && existingFriendship.status === 'accepted') {
        throw new ApiError(400, 'Các bạn đã là bạn bè');
    }

    if (existingFriendship && (existingFriendship.status === 'rejected' || existingFriendship.status === 'none')) {
        existingFriendship.status = 'pending';
        existingFriendship.sentAt = Date.now();
        existingFriendship.requesterId = requesterId;
        existingFriendship.recipientId = recipientId;
        await existingFriendship.save();

        await publishFriendRequestSent(requesterId, recipientId, existingFriendship._id);
        return existingFriendship;
    }

    const friendship = new Friendship({
        requesterId,
        recipientId,
        status: 'pending'
    });

    await friendship.save();
    await publishFriendRequestSent(requesterId, recipientId, friendship._id);

    return friendship;
};

const publishFriendRequestSent = async (requesterId, recipientId, friendshipId) => {
    try {
        let requesterName = 'Người dùng';
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.get(`/internal/users/${requesterId}/basic`);
            requesterName = data?.profile?.fullName || 'Người dùng';
        } catch (err) {
            console.error('[Friend Service] Failed to get requester name:', err.message);
        }

        // Bắn event FRIEND_REQUEST_SENT sang EventBus
        await eventBus.publish(EventTypes.FRIEND_REQUEST_SENT, {
            requesterId: requesterId.toString(),
            recipientId: recipientId.toString(),
            friendshipId: friendshipId.toString(),
            requesterName
        });
    } catch (e) {
        console.error('[Friend Service] Lỗi bắn event FRIEND_REQUEST_SENT:', e.message);
    }
};

const getFriendRequests = async (userId) => {
    const friendRequests = await Friendship.find({
        recipientId: userId,
        status: 'pending'
    }).sort({ sentAt: -1 }).lean();

    const requesterIds = friendRequests.map(fr => fr.requesterId.toString());
    let requestersMap = {};

    if (requesterIds.length > 0) {
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.post('/internal/users/bulk', { userIds: requesterIds });
            data.forEach(user => {
                requestersMap[user._id.toString()] = user;
            });
        } catch (err) {
            console.error('[Friend Service] Failed to get requester profiles:', err.message);
        }
    }

    const listFriendRequests = friendRequests.map(friendRequest => {
        const requester = requestersMap[friendRequest.requesterId.toString()];
        return {
            _id: friendRequest._id,
            partner: requester ? {
                _id: requester._id,
                fullName: requester.profile?.fullName,
                avatar: requester.profile?.avatar,
                email: requester.email
            } : null,
            sentAt: {
                full: formatSpecificDate(friendRequest.sentAt),
                friendly: getFriendlyTime(friendRequest.sentAt)
            }
        };
    }).filter(r => r.partner !== null);

    return listFriendRequests;
};

const responseFriendRequest = async (userId, requestId, status) => {
    const friendship = await Friendship.findById(requestId);
    if (!friendship) {
        throw new ApiError(404, 'Không tìm thấy yêu cầu kết bạn');
    }

    if (friendship.status !== 'pending') {
        throw new ApiError(400, 'Yêu cầu kết bạn đã được xử lý');
    }

    if (friendship.recipientId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Không có quyền thực hiện hành động này');
    }

    if (status === 'accept') {
        friendship.status = 'accepted';
        friendship.respondedAt = Date.now();
        await friendship.save();

        // 1. Cập nhật conversation to permanent bên Chat Service
        try {
            const chatClient = createServiceClient('chat');
            await chatClient.patch('/internal/conversations/permanent', {
                participants: [friendship.requesterId.toString(), friendship.recipientId.toString()],
                isPermanent: true
            });
        } catch (err) {
            console.error('[Friend Service] Failed to update conversation isPermanent in Chat Service:', err.message);
        }

        // 2. Bắn events và socket notify
        try {
            let requesterName = 'Người dùng';
            let recipientName = 'Người dùng';
            try {
                const userClient = createServiceClient('user');
                const [reqRes, recRes] = await Promise.all([
                    userClient.get(`/internal/users/${friendship.requesterId}/basic`),
                    userClient.get(`/internal/users/${friendship.recipientId}/basic`)
                ]);
                requesterName = reqRes.data?.profile?.fullName || 'Người dùng';
                recipientName = recRes.data?.profile?.fullName || 'Người dùng';
            } catch (err) {
                console.error('[Friend Service] Failed to get profile names:', err.message);
            }

            // Bắn event FRIEND_REQUEST_ACCEPTED
            await eventBus.publish(EventTypes.FRIEND_REQUEST_ACCEPTED, {
                requesterId: friendship.requesterId.toString(),
                recipientId: friendship.recipientId.toString(),
                friendshipId: friendship._id.toString(),
                requesterName,
                recipientName
            });

            // Socket notify cho requester
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: friendship.requesterId.toString(),
                event: 'friend_request_responded',
                data: {
                    friendshipId: friendship._id.toString(),
                    recipientId: userId.toString(),
                    status: 'accepted'
                }
            });
        } catch (e) {
            console.error('[Friend Service] Lỗi bắn event accepted kết bạn:', e.message);
        }

        return 'Đã chấp nhận yêu cầu kết bạn';
    } else if (status === 'reject') {
        friendship.status = 'rejected';
        friendship.respondedAt = Date.now();
        await friendship.save();

        // Bắn event FRIEND_REQUEST_REJECTED
        try {
            let requesterName = 'Người dùng';
            try {
                const userClient = createServiceClient('user');
                const { data } = await userClient.get(`/internal/users/${friendship.requesterId}/basic`);
                requesterName = data?.profile?.fullName || 'Người dùng';
            } catch (err) {
                console.error('[Friend Service] Failed to get requester name:', err.message);
            }

            await eventBus.publish(EventTypes.FRIEND_REQUEST_REJECTED, {
                requesterId: friendship.requesterId.toString(),
                recipientId: friendship.recipientId.toString(),
                friendshipId: friendship._id.toString(),
                requesterName
            });

            // Socket notify cho requester
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: friendship.requesterId.toString(),
                event: 'friend_request_responded',
                data: {
                    friendshipId: friendship._id.toString(),
                    recipientId: userId.toString(),
                    status: 'rejected'
                }
            });
        } catch (e) {
            console.error('[Friend Service] Lỗi bắn event rejected kết bạn:', e.message);
        }

        return 'Đã từ chối yêu cầu kết bạn';
    } else {
        throw new ApiError(400, 'Trạng thái không hợp lệ');
    }
};

const removeFriend = async (userId, friendId) => {
    const friendship = await Friendship.findOneAndDelete({
        $or: [
            { requesterId: userId, recipientId: friendId, status: 'accepted' },
            { requesterId: friendId, recipientId: userId, status: 'accepted' }
        ]
    });

    if (!friendship) {
        throw new ApiError(404, 'Không tìm thấy quan hệ bạn bè này');
    }

    // 1. Cập nhật conversation to permanent = false bên Chat Service
    try {
        const chatClient = createServiceClient('chat');
        await chatClient.patch('/internal/conversations/permanent', {
            participants: [userId.toString(), friendId.toString()],
            isPermanent: false
        });
    } catch (err) {
        console.error('[Friend Service] Failed to reset conversation isPermanent in Chat Service:', err.message);
    }

    // 2. Bắn event và thông báo
    try {
        let removerName = 'Người dùng';
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.get(`/internal/users/${userId}/basic`);
            removerName = data?.profile?.fullName || 'Người dùng';
        } catch (err) {
            console.error('[Friend Service] Failed to get remover name:', err.message);
        }

        // Bắn event NOTIFICATION_PUSH cho friend
        await eventBus.publish(EventTypes.NOTIFICATION_PUSH, {
            recipientId: friendId.toString(),
            senderId: userId.toString(),
            type: 'friendship_ended',
            content: `${removerName} đã hủy kết bạn với bạn.`,
            metadata: { friendshipId: friendship._id.toString() }
        });
    } catch (e) {
        console.error('[Friend Service] Lỗi bắn notification khi hủy kết bạn:', e.message);
    }

    return 'Đã hủy kết bạn';
};

const checkFriendshipStatus = async (userId, targetUserId) => {
    const friendship = await Friendship.findOne({
        $or: [
            { requesterId: userId, recipientId: targetUserId },
            { requesterId: targetUserId, recipientId: userId }
        ]
    });

    if (!friendship || friendship.status === 'rejected') {
        return { status: 'none', friendshipId: null };
    }

    if (friendship.status === 'accepted') {
        return { status: 'friends', friendshipId: friendship._id };
    }

    if (friendship.status === 'pending') {
        if (friendship.requesterId.toString() === userId.toString()) {
            return { status: 'request_sent', friendshipId: friendship._id };
        } else {
            return { status: 'request_received', friendshipId: friendship._id };
        }
    }

    return { status: friendship.status, friendshipId: friendship._id };
};

// Internal API cho các service khác gọi để lấy friendIds list của 1 user
const getFriendIdsInternal = async (userId) => {
    const friendships = await Friendship.find({
        $or: [
            { requesterId: userId, status: 'accepted' },
            { recipientId: userId, status: 'accepted' }
        ]
    }).select('requesterId recipientId').lean();

    const friendIds = friendships.map(f =>
        f.requesterId.toString() === userId.toString() ? f.recipientId.toString() : f.requesterId.toString()
    );

    return friendIds;
};

const getFriendsStatsInternal = async () => {
    const total = await Friendship.countDocuments({ status: 'accepted' });
    return { totalFriendships: total };
};

export default {
    getListFriends,
    sendFriendRequest,
    getFriendRequests,
    responseFriendRequest,
    removeFriend,
    checkFriendshipStatus,
    getFriendIdsInternal,
    getFriendsStatsInternal
};
