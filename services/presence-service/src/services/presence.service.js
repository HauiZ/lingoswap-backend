import redis from '../config/redis.js';
import eventBus from '../config/eventBus.js';
import { EventTypes } from '../events/eventTypes.js';
import { createServiceClient } from '../http/serviceClient.js';

const onlineUsers = new Map();
const disconnectTimers = new Map(); // Grace period timers
const GRACE_PERIOD_MS = 5000; // 5 seconds disconnect timeout

const setOnline = async (userId, socketId) => {
    if (disconnectTimers.has(userId)) {
        clearTimeout(disconnectTimers.get(userId));
        disconnectTimers.delete(userId);
        console.log(`[Presence] ${userId} RECONNECTED`);

        onlineUsers.set(userId, {
            socketId,
            lastHeartbeat: Date.now()
        });
        await redis.set(`socket:${userId}`, socketId, 'EX', 86400);
        return;
    }

    const wasOnline = onlineUsers.has(userId);

    onlineUsers.set(userId, {
        socketId,
        lastHeartbeat: Date.now()
    });
    await redis.set(`socket:${userId}`, socketId, 'EX', 86400);

    if (!wasOnline) {
        await broadcastStatusToFriends(userId, 'online');
        // Publish USER_ONLINE event
        await eventBus.publish(EventTypes.USER_ONLINE, { userId, timestamp: Date.now() });
    }

    console.log(`[Presence] ${userId} ONLINE (RAM: ${onlineUsers.size} users)`);
};

const scheduleOffline = (userId, disconnectedSocketId, onDisconnectCallback) => {
    const entry = onlineUsers.get(userId);
    // Nếu socket đang active khác với socket vừa disconnect, tức là có một connection MỚI đã thay thế.
    if (entry && entry.socketId !== disconnectedSocketId) {
        return;
    }

    if (disconnectTimers.has(userId)) {
        clearTimeout(disconnectTimers.get(userId));
    }

    const timer = setTimeout(async () => {
        disconnectTimers.delete(userId);

        // Kiểm tra lại lần nữa lúc thực thi (đề phòng có socket mới connect trong lúc chờ)
        const currentEntry = onlineUsers.get(userId);
        if (currentEntry && currentEntry.socketId !== disconnectedSocketId) {
            return;
        }

        // Thực sự đánh dấu offline
        await setOffline(userId);

        // Gọi callback để xử lý thêm (rời hàng chờ, v.v.)
        if (onDisconnectCallback) {
            await onDisconnectCallback();
        }
    }, GRACE_PERIOD_MS);

    disconnectTimers.set(userId, timer);
};

const setOffline = async (userId) => {
    const wasOnline = onlineUsers.has(userId);

    onlineUsers.delete(userId);

    await redis.del(`socket:${userId}`);

    if (wasOnline) {
        // Publish USER_OFFLINE event (User Service will sync it to DB)
        await eventBus.publish(EventTypes.USER_OFFLINE, { userId, timestamp: Date.now() });
        await broadcastStatusToFriends(userId, 'offline');
    }

    console.log(`[Presence] ${userId} OFFLINE (RAM: ${onlineUsers.size} users)`);
};

const isReconnecting = (userId) => {
    return disconnectTimers.has(userId);
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

const startTimeoutChecker = () => {
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
            // Không kick user đang in-call hoặc waiting
            try {
                const userClient = createServiceClient('user');
                const { data: user } = await userClient.get(`/internal/users/${userId}`);
                if (user?.status === "in-call" || user?.status === "waiting") {
                    const entry = onlineUsers.get(userId);
                    if (entry) entry.lastHeartbeat = Date.now(); // gia hạn
                    console.log(`[Presence] Bỏ qua timeout cho ${userId} (status=${user.status})`);
                    continue;
                }
            } catch (e) {
                console.error(`[Presence] Lỗi check status ${userId}:`, e.message);
                continue; // lỗi DB → không kick để an toàn
            }

            console.log(`[Presence] Heartbeat timeout → ${userId}`);
            await setOffline(userId);
        }

        if (expiredUsers.length > 0) {
            console.log(`[Presence] Timeout checker: ${expiredUsers.length} users marked offline.`);
        }
    }, CHECK_INTERVAL_MS);

    console.log('[Presence] Timeout checker started (interval: 30s, threshold: 90s).');
};

const broadcastStatusToFriends = async (userId, status) => {
    try {
        const friendClient = createServiceClient('friend');
        const { data } = await friendClient.get(`/internal/friends/${userId}/ids`);
        const friendIds = data?.friendIds || data || [];

        for (const friendId of friendIds) {
            const friendEntry = onlineUsers.get(friendId.toString());
            if (friendEntry) {
                // Publish SOCKET_EMIT event to gateway
                await eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: friendId.toString(),
                    event: 'friend_status_change',
                    data: {
                        userId,
                        status
                    }
                });
            }
        }
    } catch (error) {
        console.error('[Presence] Broadcast error:', error.message);
    }
};

const getOnlineFriendIds = async (userId) => {
    try {
        const friendClient = createServiceClient('friend');
        const { data } = await friendClient.get(`/internal/friends/${userId}/ids`);
        const friendIds = data?.friendIds || data || [];
        return friendIds.filter(id => onlineUsers.has(id.toString()));
    } catch (error) {
        console.error('[Presence] getOnlineFriendIds error:', error.message);
        return [];
    }
};

const getOnlineCount = () => onlineUsers.size;

const forceDisconnect = async (userId) => {
    const socketId = await getSocketId(userId);
    if (socketId) {
        // Publish SOCKET_EMIT event to emit 'banned' message
        await eventBus.publish(EventTypes.SOCKET_EMIT, {
            targetUserId: userId,
            event: 'banned',
            data: { message: 'Tài khoản của bạn đã bị khóa.' }
        });

        // Publish force disconnect event that Gateway subscribes to
        await eventBus.publish('socket.force_disconnect', { userId });
        await setOffline(userId);
    }
};

export default {
    setOnline,
    setOffline,
    scheduleOffline,
    isReconnecting,
    refreshHeartbeat,
    isOnline,
    getSocketId,
    startTimeoutChecker,
    getOnlineFriendIds,
    getOnlineCount,
    forceDisconnect
};
