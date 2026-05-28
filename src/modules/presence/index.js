import { handlePresenceProvider } from './controllers/presenceHandler.js';

export default {
    initSockets: (io, socket) => {
        handlePresenceProvider(io, socket);
    }
};
