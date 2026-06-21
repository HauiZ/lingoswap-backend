import User from '../entities/User.js';

const getUserByIdInternal = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserBasicInfo = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('profile.fullName profile.avatar profile.country');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUsersByIds = async (req, res) => {
  try {
    const { userIds } = req.body;
    const users = await User.find({ _id: { $in: userIds } }).select('profile.fullName profile.avatar profile.country');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUserStats = async (req, res) => {
  try {
    const { streak, lastStreakUpdate, totalHours, totalSessions, learningCalendar } = req.body;
    const updateData = {};
    if (streak !== undefined) updateData['stats.streak'] = streak;
    if (lastStreakUpdate !== undefined) updateData['stats.lastStreakUpdate'] = lastStreakUpdate;
    if (totalHours !== undefined) updateData['stats.totalHours'] = totalHours;
    if (totalSessions !== undefined) updateData['stats.totalSessions'] = totalSessions;
    if (learningCalendar !== undefined) updateData['stats.learningCalendar'] = learningCalendar;

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const banUserInternal = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      statusAccount: 'banned',
      bannedUntil: req.body.bannedUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Mặc định khóa 7 ngày
    }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUsersStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ statusAccount: 'active' });
    const bannedUsers = await User.countDocuments({ statusAccount: 'banned' });
    res.json({ totalUsers, activeUsers, bannedUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  getUserByIdInternal,
  getUserBasicInfo,
  getUsersByIds,
  updateUserStatus,
  updateUserStats,
  banUserInternal,
  getUsersStats
};
