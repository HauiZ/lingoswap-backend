import { handlePresenceProvider } from './presenceHandler.js';

export default {
    initSockets: (io, socket) => {
        handlePresenceProvider(io, socket);
    }
};
