import redis from '../../../core/config/redis.js';
import presenceService from '../../presence/services/presence.service.js';
import {
    findOrQueuePartnerService,
    handleQueueTimeoutService,
    leaveMatchAndQueueService,
    requestDirectMatchService,
    acceptDirectMatchService
} from '../services/match.service.js';

const QUEUE_TIMEOUT_SECONDS = 60;

export const handleMatchProvider = (io, socket) => {
    const getUserId = () => {
        return socket.user ? socket.user._id.toString() : socket.id;
    };

    const clearQueueTimeout = (s) => {
        if (s && s.queueTimeout) {
            clearTimeout(s.queueTimeout);
            s.queueTimeout = null;
            console.log(`[Clear] Đã hủy Timeout cho socket: ${s.id}`);
        }
    };

    socket.on('join_queue', async ({ language }) => {
        const userId = getUserId();
        socket.currentLanguage = language;

        try {
            // Delegate logic to Service Layer
            const result = await findOrQueuePartnerService(userId, language);

            if (result.status === 'already_waiting') {
                socket.emit('waiting_status', { message: result.message });
                return;
            }

            if (result.status === 'match_found') {
                const partnerSocketId = await redis.get(`socket:${result.partnerId}`);
                const roomId = result.sessionId;

                // Handle room joining
                socket.join(roomId);
                if (partnerSocketId) {
                    const partnerSocket = io.sockets.sockets.get(partnerSocketId);
                    if (partnerSocket) {
                        partnerSocket.join(roomId);
                        clearQueueTimeout(partnerSocket);
                    }
                }
                clearQueueTimeout(socket);

                // Broadcast socket events - Frontend interface unchanged
                io.to(socket.id).emit('match_found', { sessionId: roomId, partnerId: result.partnerId });
                if (partnerSocketId) {
                    io.to(partnerSocketId).emit('match_found', { sessionId: roomId, partnerId: userId });
                }

                console.log(`[Match] ${userId} <-> ${result.partnerId} (${language})`);

            } else if (result.status === 'waiting') {
                clearQueueTimeout(socket);
                socket.emit('waiting_status', { message: 'Đang tìm kiếm đối thủ...' });

                // Start Timeout logic
                socket.queueTimeout = setTimeout(async () => {
                    const isRemoved = await handleQueueTimeoutService(userId, language);
                    if (isRemoved) {
                        socket.emit('queue_timeout', {
                            message: 'Không tìm được đối tác. Vui lòng thử lại.',
                        });
                        console.log(`[Timeout] ${userId} đã rời hàng chờ sau ${QUEUE_TIMEOUT_SECONDS}s`);
                        socket.queueTimeout = null;
                    }
                }, QUEUE_TIMEOUT_SECONDS * 1000);
                console.log(`[Queue] ${userId} đã tham gia hàng chờ`);
            }

        } catch (err) {
            console.error('Match Error:', err);
            socket.emit('error', err.message || 'Lỗi hệ thống Matching');
        }
    });

    const leaveMatchAndQueue = async () => {
        const userId = getUserId();

        // 1. Clear Timeout
        clearQueueTimeout(socket);

        try {
            // 2. Delegate cleanup to Service Layer
            const { partnerId, updatedStreaks } = await leaveMatchAndQueueService(userId, socket.currentLanguage);

            // 3. Broadcast disconnection to partner if they exist
            if (partnerId) {
                const partnerSocketId = await redis.get(`socket:${partnerId}`);
                if (partnerSocketId) {
                    io.to(partnerSocketId).emit('partner_disconnected', {
                        message: 'Đối tác đã rời cuộc trò chuyện.',
                    });
                }
            }

            // 4. Broadcast streak update if any user got their streak updated
            if (updatedStreaks && updatedStreaks.length > 0) {
                for (const u of updatedStreaks) {
                    const uSocketId = await redis.get(`socket:${u.userId}`);
                    if (uSocketId) {
                        io.to(uSocketId).emit('streak_update', { streak: u.streak });
                    }
                }
            }
            console.log(`[Leave] ${userId} đã rời hàng chờ`);
        } catch (error) {
            console.error('Cleanup Error:', error);
        }
    };

    socket.on('direct_match_request', async ({ targetUserId }) => {
        const userId = getUserId();
        try {
            const partnerSocketId = await requestDirectMatchService(userId, targetUserId);

            io.to(partnerSocketId).emit('direct_match_offer', {
                callerId: userId,
                message: 'Bạn có một cuộc gọi đến.'
            });
        } catch (err) {
            socket.emit('direct_match_error', { message: err.message });
        }
    });

    socket.on('direct_match_response', async ({ callerId, accept }) => {
        const userId = getUserId();
        try {
            const callerSocketId = await redis.get(`socket:${callerId}`);

            if (!accept) {
                if (callerSocketId) {
                    io.to(callerSocketId).emit('direct_match_rejected', {
                        message: 'Người dùng đã từ chối cuộc gọi.'
                    });
                }
                return;
            }

            // Accept Match
            const { sessionId } = await acceptDirectMatchService(callerId, userId);

            socket.join(sessionId);
            if (callerSocketId) {
                const callerSocket = io.sockets.sockets.get(callerSocketId);
                if (callerSocket) {
                    callerSocket.join(sessionId);
                    clearQueueTimeout(callerSocket);
                }
            }
            clearQueueTimeout(socket);

            // Notify both to transition to call room
            io.to(socket.id).emit('match_found', { sessionId, partnerId: callerId });
            if (callerSocketId) {
                io.to(callerSocketId).emit('match_found', { sessionId, partnerId: userId });
            }

        } catch (err) {
            console.error('Direct Match Accept Error:', err);
            socket.emit('direct_match_error', { message: err.message });
            const callerSocketId = await redis.get(`socket:${callerId}`);
            if (callerSocketId) {
                io.to(callerSocketId).emit('direct_match_error', { message: 'Lỗi khi đồng ý kết nối.' });
            }
        }
    });

    socket.on('webrtc_offer', ({ sessionId, offer }) => {
        socket.to(sessionId).emit('webrtc_offer', { offer });
    });

    socket.on('webrtc_answer', ({ sessionId, answer }) => {
        socket.to(sessionId).emit('webrtc_answer', { answer });
    });

    socket.on('webrtc_ice_candidate', ({ sessionId, candidate }) => {
        socket.to(sessionId).emit('webrtc_ice_candidate', { candidate });
    });

    socket.on('leave_queue', leaveMatchAndQueue);

    socket.on('disconnect', () => {
        const userId = getUserId();
        setTimeout(async () => {
            if (!presenceService.isReconnecting(userId) && !presenceService.isOnline(userId)) {
                await leaveMatchAndQueue();
            }
        }, 5500);
    });
};
