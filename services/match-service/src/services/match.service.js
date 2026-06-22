import redis from '../config/redis.js';
import MatchSession from '../entities/MatchSession.js';
import { createServiceClient } from '../http/serviceClient.js';
import eventBus from '../config/eventBus.js';
import { EventTypes } from '../events/eventTypes.js';

export const findOrQueuePartnerService = async (userId, language) => {
    const queueKey = `queue:${language}`;

    const userClient = createServiceClient('user');
    const { data: user } = await userClient.get(`/internal/users/${userId}`);
    if (user?.status === 'in-call') {
        throw new Error('Bạn đang trong một cuộc gọi.');
    }

    const alreadyInQueue = await redis.lpos(queueKey, userId);
    if (alreadyInQueue !== null) {
        return { status: 'already_waiting', message: 'Bạn đã trong hàng chờ...' };
    }

    // Lua script to atomically pop a partner, avoiding self-matching
    const luaScript = `
        local candidate = redis.call('LPOP', KEYS[1])
        if candidate == false then return nil end
        if candidate == ARGV[1] then
            redis.call('RPUSH', KEYS[1], candidate)
            return nil
        end
        return candidate
    `;
    const partnerId = await redis.eval(luaScript, 1, queueKey, userId);

    if (partnerId) {
        await redis.lrem(queueKey, 0, userId);
        const newSession = await MatchSession.create({
            participants: [userId, partnerId],
            language,
            status: 'ongoing',
            startedAt: new Date(),
        });

        // Cập nhật trạng thái in-call trong User Service
        await Promise.all([
            userClient.patch(`/internal/users/${userId}/status`, { status: 'in-call' }),
            userClient.patch(`/internal/users/${partnerId}/status`, { status: 'in-call' })
        ]).catch(err => console.error('[Match Service] Failed to set status to in-call:', err.message));

        // Bắn event MATCH_CREATED sang Chat Service
        await eventBus.publish(EventTypes.MATCH_CREATED, {
            sessionId: newSession._id.toString(),
            participants: [userId.toString(), partnerId.toString()],
            language
        });

        return { status: 'match_found', partnerId, sessionId: newSession._id.toString() };
    } else {
        await userClient.patch(`/internal/users/${userId}/status`, { status: 'waiting' })
            .catch(err => console.error('[Match Service] Failed to set status to waiting:', err.message));
        await redis.rpush(queueKey, userId);
        return { status: 'waiting' };
    }
};

export const handleQueueTimeoutService = async (userId, language) => {
    const queueKey = `queue:${language}`;
    const stillInQueue = await redis.lpos(queueKey, userId);
    if (stillInQueue !== null) {
        await redis.lrem(queueKey, 0, userId);
        
        const userClient = createServiceClient('user');
        await userClient.patch(`/internal/users/${userId}/status`, { status: 'idle' })
            .catch(err => console.error('[Match Service] Failed to set status to idle:', err.message));
        return true;
    }
    return false;
};

export const leaveMatchAndQueueService = async (userId, currentLanguage) => {
    if (currentLanguage) {
        await redis.lrem(`queue:${currentLanguage}`, 0, userId);
    }

    let activeSession = await MatchSession.findOne({ participants: userId, status: 'ongoing' });
    let partnerId = null;

    if (activeSession) {
        activeSession.status = 'completed';
        activeSession.endedAt = new Date();
        await activeSession.save();

        partnerId = activeSession.participants.find(
            (id) => id.toString() !== userId.toString()
        );

        // Bắn event MATCH_ENDED cho User Service cập nhật stats + reset status về idle
        await eventBus.publish(EventTypes.MATCH_ENDED, {
            sessionId: activeSession._id.toString(),
            participants: activeSession.participants.map(p => p.toString()),
            durationSeconds: activeSession.durationSeconds,
            endedAt: activeSession.endedAt.toISOString()
        });
    }

    // Đảm bảo user hiện tại được set status idle
    const userClient = createServiceClient('user');
    await userClient.patch(`/internal/users/${userId}/status`, { status: 'idle' })
        .catch(err => console.error(`[Match Service] Failed to set status to idle for ${userId}:`, err.message));

    return { activeSession, partnerId };
};

export const requestDirectMatchService = async (callerId, targetUserId) => {
    const userClient = createServiceClient('user');
    const { data: targetUser } = await userClient.get(`/internal/users/${targetUserId}`);
    if (!targetUser) {
        throw new Error('Người dùng không tồn tại.');
    }
    if (targetUser.status === 'in-call') {
        throw new Error('Người này đang trong một cuộc gọi khác.');
    }

    const partnerSocketId = await redis.get(`socket:${targetUserId}`);
    if (!partnerSocketId) {
        throw new Error('Người dùng hiện đang offline.');
    }
    return partnerSocketId;
};

export const acceptDirectMatchService = async (callerId, targetUserId) => {
    const userClient = createServiceClient('user');
    const [{ data: user1 }, { data: user2 }] = await Promise.all([
        userClient.get(`/internal/users/${callerId}`),
        userClient.get(`/internal/users/${targetUserId}`)
    ]);

    if (user1?.status === 'in-call' || user2?.status === 'in-call') {
        throw new Error('Một trong hai người đang trong cuộc gọi khác.');
    }

    const newSession = await MatchSession.create({
        participants: [callerId, targetUserId],
        language: 'any',
        status: 'ongoing',
        startedAt: new Date(),
    });

    await Promise.all([
        userClient.patch(`/internal/users/${callerId}/status`, { status: 'in-call' }),
        userClient.patch(`/internal/users/${targetUserId}/status`, { status: 'in-call' })
    ]).catch(err => console.error('[Match Service] Failed to set status to in-call:', err.message));

    // Bắn event MATCH_CREATED để Chat Service tạo cuộc hội thoại tạm thời
    await eventBus.publish(EventTypes.MATCH_CREATED, {
        sessionId: newSession._id.toString(),
        participants: [callerId.toString(), targetUserId.toString()],
        language: 'any'
    });

    return { sessionId: newSession._id.toString() };
};
