import User from '../entities/User.js';
import UserReview from '../entities/UserReview.js';
import Appeal from '../entities/Appeal.js';

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
    const users = await User.find({ _id: { $in: userIds } }).select('profile.fullName profile.avatar profile.country email lastOnlineAt role statusAccount bannedUntil');
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

const unbanUserInternal = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      statusAccount: 'active',
      bannedUntil: null
    }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUserInternal = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
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

const getUsersInternal = async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) query.role = role;
    const users = await User.find(query).select('-password -__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createUserReviewInternal = async (req, res) => {
  try {
    const { reviewerId, targetUserId, matchSessionId, rating, comment } = req.body;
    const review = await UserReview.create({
      reviewerId,
      targetUserId,
      matchSessionId,
      rating,
      comment
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserReviewsBySessionsInternal = async (req, res) => {
  try {
    const { matchSessionIds } = req.body;
    const reviews = await UserReview.find({ matchSessionId: { $in: matchSessionIds } }).lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserReviewsBySessionInternal = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const reviews = await UserReview.find({ matchSessionId: sessionId }).lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkUserReviewInternal = async (req, res) => {
  try {
    const { reviewerId, matchSessionId } = req.query;
    const review = await UserReview.findOne({ reviewerId, matchSessionId });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllAppealsInternal = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const query = {};
    if (status) query.status = status;

    const appeals = await Appeal.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const userIds = appeals.map(a => a.userId.toString()).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('profile.fullName email username statusAccount bannedUntil').lean();
    const usersMap = {};
    users.forEach(u => {
      usersMap[u._id.toString()] = u;
    });

    const populatedAppeals = appeals.map(appeal => ({
      ...appeal,
      userId: usersMap[appeal.userId?.toString()] || null
    }));

    res.json(populatedAppeals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resolveAppealInternal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, resolvedByAdminId } = req.body;

    const appeal = await Appeal.findById(id).populate('userId');
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });
    if (appeal.status !== 'pending') return res.status(400).json({ error: 'Appeal already resolved' });

    appeal.status = status;
    if (adminNotes) appeal.adminNotes = adminNotes;
    appeal.resolvedByAdminId = resolvedByAdminId;

    if (status === 'approved') {
      const user = await User.findById(appeal.userId?._id);
      if (user) {
        user.statusAccount = 'active';
        user.bannedUntil = null;
        await user.save();
      }
    }

    await appeal.save();
    res.json(appeal);
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
  unbanUserInternal,
  deleteUserInternal,
  getUsersStats,
  getUsersInternal,
  createUserReviewInternal,
  getUserReviewsBySessionsInternal,
  getUserReviewsBySessionInternal,
  checkUserReviewInternal,
  getAllAppealsInternal,
  resolveAppealInternal
};
