import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

/**
 * Service to handle saving a chat message and managing conversation state
 */
export const saveMessageService = async ({ senderId, partnerId, content, matchSessionId, type = 'text' }) => {
    // 1. Find existing conversation or create a new one
    let conversation = await Conversation.findOne({
        participants: { $all: [senderId, partnerId] }
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [senderId, partnerId],
            matchSessionId: matchSessionId || null,
            isPermanent: false
        });
    }

    // 2. Create the message
    const newMessage = await Message.create({
        conversationId: conversation._id,
        senderId,
        content,
        type
    });

    // 3. Update the conversation's last message and last updated time
    await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: newMessage._id,
        updatedAt: Date.now()
    });

    // 4. Return the structured data to be emitted to sockets
    return {
        messageData: {
            ...newMessage.toObject(),
            conversationId: conversation._id
        },
        newMessage
    };
};
