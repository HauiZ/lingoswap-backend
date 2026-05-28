import { handleMatchProvider } from './controllers/matchHandler.js';

export default {
    initSockets: (io, socket) => {
        handleMatchProvider(io, socket);
    }
};
