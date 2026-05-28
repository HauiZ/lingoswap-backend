import redis from '../../../core/config/redis.js';
import User from '../../users/entities/User.js';
import MatchSession from '../entities/MatchSession.js';

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
        await User.findByIdAndUpdate(userId, { status: 'idle' });
        return true;
    }
    return false;
};

export const leaveMatchAndQueueService = async (userId, currentLanguage) => {
    if (currentLanguage) {
        await redis.lrem(`queue:${currentLanguage}`, 0, userId);
    }

    let activeSession = await MatchSession.findOne({ participants: userId, status: 'ongoing' });
    let updatedStreaks = [];
    if (activeSession) {
        activeSession.status = 'completed';
        activeSession.endedAt = new Date();
        await activeSession.save();

        const durationHours = activeSession.durationSeconds / 3600;
        const sessionEndTime = activeSession.endedAt || new Date();

        const getVnDateStr = (date) => {
            const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
            return d.toISOString().split('T')[0];
        };

        const dateStr = getVnDateStr(sessionEndTime);

        if (activeSession.durationSeconds > 0) {
            const users = await User.find({ _id: { $in: activeSession.participants } });
            const yesterdayStr = getVnDateStr(new Date(sessionEndTime.getTime() - 24 * 60 * 60 * 1000));
            const bulkOps = [];

            for (const p of users) {
                if (!p.stats) p.stats = { streak: 0, totalSessions: 0, totalHours: 0, learningCalendar: [] };
                const lastUpdateStr = p.stats.lastStreakUpdate ? getVnDateStr(p.stats.lastStreakUpdate) : null;
                let newStreak = p.stats.streak || 0;

                if (lastUpdateStr !== dateStr) {
                    if (lastUpdateStr === yesterdayStr) {
                        newStreak += 1;
                    } else {
                        newStreak = 1;
                    }
                    updatedStreaks.push({ userId: p._id.toString(), streak: newStreak });
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: p._id },
                            update: {
                                $set: {
                                    'stats.streak': newStreak,
                                    'stats.lastStreakUpdate': sessionEndTime
                                },
                                $inc: {
                                    'stats.totalSessions': 1,
                                    'stats.totalHours': durationHours
                                },
                                $addToSet: {
                                    'stats.learningCalendar': dateStr
                                }
                            }
                        }
                    });
                } else {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: p._id },
                            update: {
                                $inc: {
                                    'stats.totalSessions': 1,
                                    'stats.totalHours': durationHours
                                },
                                $addToSet: {
                                    'stats.learningCalendar': dateStr
                                }
                            }
                        }
                    });
                }
            }

            if (bulkOps.length > 0) {
                await User.bulkWrite(bulkOps).catch(err => console.error("Lỗi bulkWrite stats User:", err));
            }

        } else {
            await User.updateMany(
                { _id: { $in: activeSession.participants } },
                { $inc: { 'stats.totalSessions': 1 } }
            ).catch(err => console.error("Lỗi cập nhật stats User:", err));
        }
    }

    let partnerId = null;
    if (activeSession) {
        partnerId = activeSession.participants.find(
            (id) => id.toString() !== userId
        );
        if (partnerId) {
            await User.findByIdAndUpdate(partnerId, { status: 'idle' });
        }
    }
    await User.findByIdAndUpdate(userId, { status: 'idle' });

    return { activeSession, partnerId, updatedStreaks };
};

export const requestDirectMatchService = async (callerId, targetUserId) => {
    const targetUser = await User.findById(targetUserId).select('status');
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
    const users = await User.find({ _id: { $in: [callerId, targetUserId] } });
    if (users.some(u => u.status === 'in-call')) {
        throw new Error('Một trong hai người đang trong cuộc gọi khác.');
    }

    const newSession = await MatchSession.create({
        participants: [callerId, targetUserId],
        language: 'any',
        status: 'ongoing',
        startedAt: new Date(),
    });

    await User.updateMany(
        { _id: { $in: [callerId, targetUserId] } },
        { status: 'in-call' }
    );

    return { sessionId: newSession._id.toString() };
};
