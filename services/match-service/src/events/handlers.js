import { EventTypes } from './eventTypes.js';
import {
    findOrQueuePartnerService,
    handleQueueTimeoutService,
    leaveMatchAndQueueService,
    requestDirectMatchService,
    acceptDirectMatchService
} from '../services/match.service.js';

const timeouts = new Map();
const QUEUE_TIMEOUT_SECONDS = 60;

const clearQueueTimeout = (userId) => {
    const t = timeouts.get(userId.toString());
    if (t) {
        clearTimeout(t);
        timeouts.delete(userId.toString());
        console.log(`[Clear] Đã hủy Timeout hàng chờ cho: ${userId}`);
    }
};

export const registerEventHandlers = (eventBus) => {
    // 1. Tham gia hàng chờ ghép cặp
    eventBus.subscribe('match.join_queue', async (payload) => {
        const { userId, language } = payload;
        try {
            console.log(`📩 [Match Service] Handling match.join_queue for ${userId} (${language})`);
            clearQueueTimeout(userId);

            const result = await findOrQueuePartnerService(userId, language);

            if (result.status === 'already_waiting') {
                await eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: userId.toString(),
                    event: 'waiting_status',
                    data: { message: result.message }
                });
                return;
            }

            if (result.status === 'match_found') {
                const roomId = result.sessionId;
                const partnerId = result.partnerId;

                clearQueueTimeout(partnerId);

                // Di chuyển cả 2 vào call room tại Gateway
                await Promise.all([
                    eventBus.publish('socket.join_room', { userId: userId.toString(), roomId }),
                    eventBus.publish('socket.join_room', { userId: partnerId.toString(), roomId })
                ]);

                // Thông báo kết nối thành công tới cả 2
                await Promise.all([
                    eventBus.publish(EventTypes.SOCKET_EMIT, {
                        targetUserId: userId.toString(),
                        event: 'match_found',
                        data: { sessionId: roomId, partnerId: partnerId.toString() }
                    }),
                    eventBus.publish(EventTypes.SOCKET_EMIT, {
                        targetUserId: partnerId.toString(),
                        event: 'match_found',
                        data: { sessionId: roomId, partnerId: userId.toString() }
                    })
                ]);

                console.log(`[Match Completed] ${userId} <-> ${partnerId} (${language})`);

            } else if (result.status === 'waiting') {
                await eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: userId.toString(),
                    event: 'waiting_status',
                    data: { message: 'Đang tìm kiếm đối thủ...' }
                });

                // Khởi động timeout hàng chờ
                const timeoutId = setTimeout(async () => {
                    const isRemoved = await handleQueueTimeoutService(userId, language);
                    if (isRemoved) {
                        await eventBus.publish(EventTypes.SOCKET_EMIT, {
                            targetUserId: userId.toString(),
                            event: 'queue_timeout',
                            data: { message: 'Không tìm được đối tác. Vui lòng thử lại.' }
                        });
                        timeouts.delete(userId.toString());
                        console.log(`[Timeout] ${userId} đã rời hàng chờ sau ${QUEUE_TIMEOUT_SECONDS}s`);
                    }
                }, QUEUE_TIMEOUT_SECONDS * 1000);
                
                timeouts.set(userId.toString(), timeoutId);
            }
        } catch (err) {
            console.error('[Match Service] Error in match.join_queue handler:', err.message);
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: userId.toString(),
                event: 'error',
                data: err.message || 'Lỗi hệ thống Matching'
            });
        }
    });

    // 2. Rời hàng chờ ghép cặp / Rời cuộc gọi
    eventBus.subscribe('match.leave_queue', async (payload) => {
        const { userId } = payload;
        try {
            console.log(`📩 [Match Service] Handling match.leave_queue for ${userId}`);
            clearQueueTimeout(userId);

            const { partnerId } = await leaveMatchAndQueueService(userId);

            if (partnerId) {
                // Thông báo cho partner là user đã rời cuộc trò chuyện
                await eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: partnerId.toString(),
                    event: 'partner_disconnected',
                    data: { message: 'Đối tác đã rời cuộc trò chuyện.' }
                });
            }
        } catch (err) {
            console.error('[Match Service] Error in match.leave_queue handler:', err.message);
        }
    });

    // 3. Yêu cầu cuộc gọi trực tiếp (Direct Match Request)
    eventBus.subscribe('match.direct_request', async (payload) => {
        const { userId, targetUserId } = payload;
        try {
            console.log(`📩 [Match Service] Handling match.direct_request from ${userId} to ${targetUserId}`);
            
            await requestDirectMatchService(userId, targetUserId);

            // Gửi lời mời tới targetUser
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: targetUserId.toString(),
                event: 'direct_match_offer',
                data: {
                    callerId: userId.toString(),
                    message: 'Bạn có một cuộc gọi đến.'
                }
            });
        } catch (err) {
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: userId.toString(),
                event: 'direct_match_error',
                data: { message: err.message }
            });
        }
    });

    // 4. Phản hồi cuộc gọi trực tiếp (Direct Match Response)
    eventBus.subscribe('match.direct_response', async (payload) => {
        const { userId, callerId, accept } = payload;
        try {
            console.log(`📩 [Match Service] Handling match.direct_response from ${userId} to caller ${callerId} (Accept: ${accept})`);

            if (!accept) {
                await eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: callerId.toString(),
                    event: 'direct_match_rejected',
                    data: { message: 'Người dùng đã từ chối cuộc gọi.' }
                });
                return;
            }

            // Đồng ý cuộc gọi
            const { sessionId } = await acceptDirectMatchService(callerId, userId);

            // Di chuyển cả 2 vào call room tại Gateway
            await Promise.all([
                eventBus.publish('socket.join_room', { userId: userId.toString(), roomId: sessionId }),
                eventBus.publish('socket.join_room', { userId: callerId.toString(), roomId: sessionId })
            ]);

            // Thông báo bắt đầu cuộc gọi tới cả 2
            await Promise.all([
                eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: userId.toString(),
                    event: 'match_found',
                    data: { sessionId, partnerId: callerId.toString() }
                }),
                eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: callerId.toString(),
                    event: 'match_found',
                    data: { sessionId, partnerId: userId.toString() }
                })
            ]);
        } catch (err) {
            console.error('[Match Service] Direct Match Accept Error:', err.message);
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: userId.toString(),
                event: 'direct_match_error',
                data: { message: err.message }
            });
            await eventBus.publish(EventTypes.SOCKET_EMIT, {
                targetUserId: callerId.toString(),
                event: 'direct_match_error',
                data: { message: 'Lỗi khi đồng ý kết nối.' }
            });
        }
    });

    // 5. Đồng bộ khi user offline (từ Presence Service)
    eventBus.subscribe(EventTypes.USER_OFFLINE, async (payload) => {
        const { userId } = payload;
        if (!userId) return;
        try {
            console.log(`📩 [Match Service] Handling USER_OFFLINE for ${userId}`);
            clearQueueTimeout(userId);

            const { partnerId } = await leaveMatchAndQueueService(userId);

            if (partnerId) {
                await eventBus.publish(EventTypes.SOCKET_EMIT, {
                    targetUserId: partnerId.toString(),
                    event: 'partner_disconnected',
                    data: { message: 'Đối tác đã rời cuộc trò chuyện.' }
                });
            }
        } catch (err) {
            console.error('[Match Service] Error in USER_OFFLINE handler:', err.message);
        }
    });
};

export default registerEventHandlers;
