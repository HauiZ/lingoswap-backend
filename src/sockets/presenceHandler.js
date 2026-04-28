import presenceService from '../services/presence.service.js';

export const handlePresenceProvider = (io, socket) => {
    socket.on('heartbeat', () => {
        const userId = socket.user._id.toString();
        presenceService.refreshHeartbeat(userId);
    });
};
