import redis from '../../core/config/redis.js';
import User from '../users/User.js';
import MatchSession from './MatchSession.js';

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

export const completeMatchSessionService = async (sessionId, userId) => {
    const session = await MatchSession.findById(sessionId);
    if (!session) {
        throw new Error('Phiên gọi không tồn tại.');
    }

    // Xác nhận user là participant
    const isParticipant = session.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
        throw new Error('Bạn không thuộc phiên gọi này.');
    }

    if (session.status !== 'ongoing') {
        throw new Error('Phiên gọi đã kết thúc trước đó.');
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    const durationHours = session.durationSeconds / 3600;

    // Ngày học theo giờ Việt Nam (UTC+7) dạng YYYY-MM-DD
    const vnEndDate = new Date(session.endedAt.getTime() + 7 * 60 * 60 * 1000);
    const dateStr = vnEndDate.toISOString().split('T')[0];

    if (session.durationSeconds > 0) {
        // update streak cho tất cả người tham gia
        const users = await User.find({ _id: { $in: session.participants } });
        // Hàm lấy chuỗi YYYY-MM-DD theo giờ Việt Nam (UTC+7)
        const getVnDateStr = (date) => {
            const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
            return d.toISOString().split('T')[0];
        };

        const now = new Date();
        const todayStr = getVnDateStr(now);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = getVnDateStr(yesterday);

        for (const p of users) {
            const lastUpdateStr = p.stats?.lastStreakUpdate ? getVnDateStr(p.stats.lastStreakUpdate) : null;

            if (lastUpdateStr !== todayStr) {
                if (lastUpdateStr === yesterdayStr) {
                    p.stats.streak += 1;
                } else {
                    p.stats.streak = 1;
                }

                p.stats.lastStreakUpdate = now;
                await p.save();
            }
        }
        // update totalSessions, totalHours và learningCalendar
        await User.updateMany(
            { _id: { $in: session.participants } },
            {
                $inc: {
                    'stats.totalSessions': 1,
                    'stats.totalHours': durationHours
                },
                $addToSet: {
                    'stats.learningCalendar': dateStr
                }
            }
        ).catch(err => console.error("Lỗi cập nhật stats User:", err));
    } else {
        await User.updateMany(
            { _id: { $in: session.participants } },
            { $inc: { 'stats.totalSessions': 1 } }
        ).catch(err => console.error("Lỗi cập nhật stats User:", err));
    }

    // Cập nhật status user về idle
    const partnerId = session.participants.find(
        (id) => id.toString() !== userId.toString()
    );
    if (partnerId) {
        await User.findByIdAndUpdate(partnerId, { status: 'idle' });
    }
    await User.findByIdAndUpdate(userId, { status: 'idle' });

    return { session, partnerId };
};

export const leaveMatchAndQueueService = async (userId, currentLanguage) => {
    if (currentLanguage) {
        await redis.lrem(`queue:${currentLanguage}`, 0, userId);
    }

    let activeSession = await MatchSession.findOne({ participants: userId, status: 'ongoing' });
    let partnerId = null;

    if (activeSession) {
        const result = await completeMatchSessionService(activeSession._id, userId);
        partnerId = result.partnerId;
    }

    return { activeSession, partnerId };
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
