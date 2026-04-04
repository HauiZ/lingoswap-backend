import redis from '../config/redis.js';
import User from '../models/User.js';
import MatchSession from '../models/MatchSession.js';

const QUEUE_TIMEOUT_SECONDS = 60;

export const handleMatchProvider = (io, socket) => {
    const getUserId = (mockId) => {
        if (mockId) return mockId;
        return socket.user ? socket.user._id.toString() : socket.id;
    };

    let currentUserId = null;

    const clearQueueTimeout = (s) => {
        if (s.queueTimeout) {
            clearTimeout(s.queueTimeout);
            s.queueTimeout = null;
            console.log(`[Clear] Đã hủy Timeout cho socket: ${s.id}`);
        }
    };

    socket.on('join_queue', async ({ language, mockUserId }) => {
        const userId = getUserId(mockUserId);
        currentUserId = userId;
        socket.currentLanguage = language;

        const queueKey = `queue:${language}`;

        try {
            const user = await User.findById(userId).select('status');
            if (user?.status === 'in-call') {
                socket.emit('error', 'Bạn đang trong một cuộc gọi.');
                return;
            }

            const alreadyInQueue = await redis.lpos(queueKey, userId);
            if (alreadyInQueue !== null) {
                socket.emit('waiting_status', { message: 'Bạn đã trong hàng chờ...' });
                return;
            }

            // Script: lấy ra candidate, nếu trùng userId thì bỏ lại và trả về nil
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
                await redis.lrem(queueKey, 0, userId)
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

                const partnerSocketId = await redis.get(`socket:${partnerId}`);
                const roomId = newSession._id.toString();

                socket.join(roomId);
                if (partnerSocketId) {
                    const partnerSocket = io.sockets.sockets.get(partnerSocketId);
                    if (partnerSocket) partnerSocket.join(roomId);
                    clearQueueTimeout(partnerSocket);
                }
                clearQueueTimeout(socket);

                io.to(socket.id).emit('match_found', { sessionId: roomId, partnerId });
                if (partnerSocketId) {
                    io.to(partnerSocketId).emit('match_found', { sessionId: roomId, partnerId: userId });
                }

                // test
                await redis.set(`socket:${userId}`, socket.id, 'EX', 3600);
                // await redis.del(`socket:${userId}`);
                // await redis.del(`socket:${partnerId}`);

                console.log(`[Match] ${userId} <-> ${partnerId} (${language})`);

            } else {
                clearQueueTimeout(socket);
                await User.findByIdAndUpdate(userId, { status: 'waiting' });
                await redis.rpush(queueKey, userId);
                await redis.set(`socket:${userId}`, socket.id, 'EX', 3600);

                socket.emit('waiting_status', { message: 'Đang tìm kiếm đối thủ...' });

                socket.queueTimeout = setTimeout(async () => {
                    const stillInQueue = await redis.lpos(queueKey, userId);
                    if (stillInQueue !== null) {
                        await redis.lrem(queueKey, 0, userId);
                        // test
                        await redis.del(`socket:${userId}`);

                        await User.findByIdAndUpdate(userId, { status: 'online' });
                        socket.emit('queue_timeout', {
                            message: 'Không tìm được đối tác. Vui lòng thử lại.',
                        });
                        console.log(`[Timeout] ${userId} đã rời hàng chờ sau ${QUEUE_TIMEOUT_SECONDS}s`);
                        socket.queueTimeout = null;
                    }
                }, QUEUE_TIMEOUT_SECONDS * 1000);
            }
        } catch (err) {
            console.error('Match Error:', err);
            socket.emit('error', 'Lỗi hệ thống Matching');
        }
    });


    const leaveMatchAndQueue = async () => {
        const userId = currentUserId || socket.id;

        // Hủy timeout nếu đang chờ
        clearQueueTimeout(socket);

        try {
            if (socket.currentLanguage) {
                await redis.lrem(`queue:${socket.currentLanguage}`, 0, userId);
            }
            // test
            await redis.del(`socket:${userId}`);

            const activeSession = await MatchSession.findOneAndUpdate(
                { participants: userId, status: 'ongoing' },
                { status: 'completed', endedAt: new Date() },
                { new: true }
            );

            if (activeSession) {
                const partnerId = activeSession.participants.find(
                    (id) => id.toString() !== userId
                );

                if (partnerId) {
                    const partnerSocketId = await redis.get(`socket:${partnerId}`);
                    if (partnerSocketId) {
                        io.to(partnerSocketId).emit('partner_disconnected', {
                            message: 'Đối tác đã rời cuộc trò chuyện.',
                        });
                    }
                    // test
                    await redis.del(`socket:${partnerId}`);
                    await User.findByIdAndUpdate(partnerId, { status: 'online' });
                }
            }
            await User.findByIdAndUpdate(userId, { status: 'online' });
            currentUserId = null;

        } catch (error) {
            console.error('Cleanup Error:', error);
        }
    };

    socket.on('disconnect', leaveMatchAndQueue);
    socket.on('leave_queue', leaveMatchAndQueue);
};