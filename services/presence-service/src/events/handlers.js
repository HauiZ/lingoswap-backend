import { EventTypes } from './eventTypes.js';
import presenceService from '../services/presence.service.js';

export const registerEventHandlers = (eventBus) => {
    // 1. Lắng nghe socket kết nối
    eventBus.subscribe(EventTypes.SOCKET_CONNECTED, async (payload) => {
        try {
            const { userId, socketId } = payload;
            console.log(`📩 [Presence Service] Handling SOCKET_CONNECTED for user: ${userId} (socket: ${socketId})`);
            if (!userId || !socketId) return;

            await presenceService.setOnline(userId, socketId);
        } catch (err) {
            console.error(`❌ [Presence Service] Error in SOCKET_CONNECTED handler:`, err.message);
        }
    });

    // 2. Lắng nghe socket ngắt kết nối (chờ reconnect)
    eventBus.subscribe(EventTypes.SOCKET_DISCONNECTED, async (payload) => {
        try {
            const { userId, socketId } = payload;
            console.log(`📩 [Presence Service] Handling SOCKET_DISCONNECTED for user: ${userId} (socket: ${socketId})`);
            if (!userId || !socketId) return;

            presenceService.scheduleOffline(userId, socketId);
        } catch (err) {
            console.error(`❌ [Presence Service] Error in SOCKET_DISCONNECTED handler:`, err.message);
        }
    });

    // 3. Lắng nghe event heartbeat để gia hạn kết nối
    eventBus.subscribe('presence.heartbeat', async (payload) => {
        try {
            const { userId } = payload;
            if (!userId) return;

            presenceService.refreshHeartbeat(userId);
        } catch (err) {
            console.error(`❌ [Presence Service] Error in presence.heartbeat handler:`, err.message);
        }
    });
};
export default registerEventHandlers;
