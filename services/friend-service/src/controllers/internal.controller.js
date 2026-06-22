import friendService from '../services/friend.service.js';

const getFriendIdsInternal = async (req, res) => {
  try {
    const { userId } = req.params;
    const friendIds = await friendService.getFriendIdsInternal(userId);
    res.json({ friendIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkFriendshipStatusInternal = async (req, res) => {
  try {
    const { userId, targetId } = req.params;
    const result = await friendService.checkFriendshipStatus(userId, targetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFriendsStatsInternal = async (req, res) => {
  try {
    const stats = await friendService.getFriendsStatsInternal();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  getFriendIdsInternal,
  checkFriendshipStatusInternal,
  getFriendsStatsInternal
};
