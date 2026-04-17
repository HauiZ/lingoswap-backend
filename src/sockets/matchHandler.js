import redis from '../config/redis.js';
import { 
    findOrQueuePartnerService, 
    handleQueueTimeoutService, 
    leaveMatchAndQueueService 
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
            const { partnerId } = await leaveMatchAndQueueService(userId, socket.currentLanguage);

            // 3. Broadcast disconnection to partner if they exist
            if (partnerId) {
                const partnerSocketId = await redis.get(`socket:${partnerId}`);
                if (partnerSocketId) {
                    io.to(partnerSocketId).emit('partner_disconnected', {
                        message: 'Đối tác đã rời cuộc trò chuyện.',
                    });
                }
            }

        } catch (error) {
            console.error('Cleanup Error:', error);
        }
    };

    socket.on('disconnect', leaveMatchAndQueue);
    socket.on('leave_queue', leaveMatchAndQueue);
};