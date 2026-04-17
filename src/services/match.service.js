import redis from '../config/redis.js';
import User from '../models/User.js';
import MatchSession from '../models/MatchSession.js';

export const findOrQueuePartnerService = async (userId, language) => {
    const queueKey = `queue:${language}`;

    const user = await User.findById(userId).select('status');
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

        await User.updateMany(
            { _id: { $in: [userId, partnerId] } },
            { status: 'in-call' }
        );

        return { status: 'match_found', partnerId, sessionId: newSession._id.toString() };
    } else {
        await User.findByIdAndUpdate(userId, { status: 'waiting' });
        await redis.rpush(queueKey, userId);
        return { status: 'waiting' };
    }
};

export const handleQueueTimeoutService = async (userId, language) => {
    const queueKey = `queue:${language}`;
    const stillInQueue = await redis.lpos(queueKey, userId);
    if (stillInQueue !== null) {
        await redis.lrem(queueKey, 0, userId);
        await User.findByIdAndUpdate(userId, { status: 'online' });
        return true; 
    }
    return false;
};

export const leaveMatchAndQueueService = async (userId, currentLanguage) => {
    if (currentLanguage) {
        await redis.lrem(`queue:${currentLanguage}`, 0, userId);
    }
    
    const activeSession = await MatchSession.findOneAndUpdate(
        { participants: userId, status: 'ongoing' },
        { status: 'completed', endedAt: new Date() },
        { new: true }
    );

    let partnerId = null;
    if (activeSession) {
        partnerId = activeSession.participants.find(
            (id) => id.toString() !== userId
        );
        if (partnerId) {
            await User.findByIdAndUpdate(partnerId, { status: 'online' });
        }
    }
    await User.findByIdAndUpdate(userId, { status: 'online' });

    return { activeSession, partnerId };
};
