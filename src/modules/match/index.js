import { handleMatchProvider } from './matchHandler.js';

export default {
    initSockets: (io, socket) => {
        handleMatchProvider(io, socket);
    }
};
