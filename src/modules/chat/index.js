import { handleChatProvider } from './chatHandler.js';

export default {
    initSockets: (io, socket) => {
        handleChatProvider(io, socket);
    }
};
