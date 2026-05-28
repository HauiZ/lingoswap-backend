import { handleChatProvider } from './controllers/chatHandler.js';

export default {
    initSockets: (io, socket) => {
        handleChatProvider(io, socket);
    }
};
