import Conversation from '../entities/Conversation.js';
import Message from '../entities/Message.js';
import conversationService from '../services/conversation.service.js';

export const getDirectConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await Conversation.find({
      participants: userId,
      matchSessionId: null
    }).lean();
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const setConversationPermanent = async (req, res) => {
  try {
    const { participants, isPermanent } = req.body;
    if (!participants || !Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({ error: 'participants must be an array of at least 2 user IDs' });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { participants: { $all: participants }, matchSessionId: null },
      { isPermanent },
      { new: true, upsert: true }
    );
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecentInteractedConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await Conversation.find({
      participants: userId
    }).sort({ updatedAt: -1 }).limit(50).lean();
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getConversationsByMatchSessions = async (req, res) => {
  try {
    const { matchSessionIds } = req.body;
    if (!matchSessionIds || !Array.isArray(matchSessionIds)) {
      return res.status(400).json({ error: 'matchSessionIds must be an array' });
    }
    const conversations = await Conversation.find({
      matchSessionId: { $in: matchSessionIds }
    }).lean();
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getConversationByMatchSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = await Conversation.findOne({
      matchSessionId: sessionId
    }).lean();
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessagesInternal = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 100, page = 1 } = req.query;
    const formattedMessages = await conversationService.getMessagesByConversation(conversationId, Number(limit), Number(page));
    res.json(formattedMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessagesStats = async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    res.json({ totalMessages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
