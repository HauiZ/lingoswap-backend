import redis from '../../core/config/redis.js';
import Friendship from '../friends/Friendship.js';

const onlineUsers = new Map();
const setOnline = async (userId, socketId, io) => {
    const wasOnline = onlineUsers.has(userId);

    onlineUsers.set(userId, {
        socketId,
        lastHeartbeat: Date.now()
    });
    await redis.set(`socket:${userId}`, socketId, 'EX', 86400);

    if (!wasOnline) {
        await broadcastStatusToFriends(userId, 'online', io);
    }

    console.log(`[Presence] ${userId} ONLINE (RAM: ${onlineUsers.size} users)`);
};


const setOffline = async (userId, io) => {
    const wasOnline = onlineUsers.has(userId);

    onlineUsers.delete(userId);

    await redis.del(`socket:${userId}`);

    await redis.sadd('sync:lastOnline:users', userId);

    if (wasOnline) {
        await broadcastStatusToFriends(userId, 'offline', io);
    }

    console.log(`[Presence] ${userId} OFFLINE (RAM: ${onlineUsers.size} users)`);
};

const refreshHeartbeat = (userId) => {
    const entry = onlineUsers.get(userId);
    if (entry) {
        entry.lastHeartbeat = Date.now();
    }
};


const isOnline = (userId) => {
    return onlineUsers.has(userId);
};

const getSocketId = async (userId) => {
    const entry = onlineUsers.get(userId);
    if (entry) return entry.socketId;

    return await redis.get(`socket:${userId}`);
};


const HEARTBEAT_TIMEOUT_MS = 90 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

let timeoutCheckerInterval = null;

const startTimeoutChecker = (io) => {
    if (timeoutCheckerInterval) return;

    timeoutCheckerInterval = setInterval(async () => {
        const now = Date.now();
        const expiredUsers = [];

        for (const [userId, entry] of onlineUsers) {
            if (now - entry.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
                expiredUsers.push(userId);
            }
        }

        // Xử lý từng user hết hạn
        for (const userId of expiredUsers) {
            console.log(`[Presence] Heartbeat timeout → ${userId}`);
            await setOffline(userId, io);
        }

        if (expiredUsers.length > 0) {
            console.log(`[Presence] Timeout checker: ${expiredUsers.length} users marked offline.`);
        }
    }, CHECK_INTERVAL_MS);

    console.log('[Presence] Timeout checker started (interval: 30s, threshold: 90s).');
};

const broadcastStatusToFriends = async (userId, status, io) => {
    try {
        const friendships = await Friendship.find({
            $or: [
                { requesterId: userId, status: 'accepted' },
                { recipientId: userId, status: 'accepted' }
            ]
        }).lean();

        const friendIds = friendships.map(f =>
            f.requesterId.toString() === userId.toString()
                ? f.recipientId.toString()
                : f.requesterId.toString()
        );

        for (const friendId of friendIds) {
            const friendEntry = onlineUsers.get(friendId);
            if (friendEntry) {
                io.to(friendEntry.socketId).emit('friend_status_change', {
                    userId,
                    status
                });
            }
        }
    } catch (error) {
        console.error('[Presence] Broadcast error:', error.message);
    }
};

const getOnlineFriendIds = async (userId) => {
    const friendships = await Friendship.find({
        $or: [
            { requesterId: userId, status: 'accepted' },
            { recipientId: userId, status: 'accepted' }
        ]
    }).lean();

    const friendIds = friendships.map(f =>
        f.requesterId.toString() === userId.toString()
            ? f.recipientId.toString()
            : f.requesterId.toString()
    );

    return friendIds.filter(id => onlineUsers.has(id));
};

const getOnlineCount = () => onlineUsers.size;

export default {
    setOnline,
    setOffline,
    refreshHeartbeat,
    isOnline,
    getSocketId,
    startTimeoutChecker,
    getOnlineFriendIds,
    getOnlineCount
};
