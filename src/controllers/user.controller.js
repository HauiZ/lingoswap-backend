import userService from '../services/user.service.js';
import logger from '../utils/logger.js';

// Lấy user theo ID (Xem public profile)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    logger.log(`Xem profile public user ID: ${id}`);
    res.json(user);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy thông tin user' });
  }
};

// Lấy hồ sơ của user đang đăng nhập hiện tại
const getMyProfile = async (req, res) => {
  try {
    const user = await userService.getMyProfile(req.user.id);
    res.json(user);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy hồ sơ cá nhân' });
  }
}

// Cập nhật hồ sơ cá nhân (Chỉ được phép tự update mình)
const updateMyProfile = async (req, res) => {
  try {
    const user = await userService.updateMyProfile(req.user.id, req.body);
    logger.log(`Cập nhật hồ sơ cá nhân thành công ID: ${req.user.id}`);
    res.json({ message: 'Cập nhật hồ sơ thành công', user });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi cập nhật hồ sơ' });
  }
};

// Upload avatar lên Cloudinary
const uploadAvatar = async (req, res) => {
  try {
    const avatarUrl = await userService.uploadAvatar(req.user.id, req.file);
    logger.log(`Cập nhật avatar thành công ID: ${req.user.id}`);
    res.json({ message: 'Cập nhật avatar thành công', avatarUrl });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi upload avatar' });
  }
};

// Lấy dashboard tổng quan (stats, lịch sử, gợi ý)
const getDashboard = async (req, res) => {
  try {
    const dashboardData = await userService.getUserDashboard(req.user.id);
    res.json(dashboardData);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy dashboard' });
  }
}

// Tìm kiếm người dùng
const searchUsers = async (req, res) => {
  try {
    const { q, page, limit } = req.query;
    const keyword = q ? String(q).trim() : '';
    const results = await userService.searchUsers(req.user.id, keyword, page, limit);
    res.json(results);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi tìm kiếm người dùng' });
  }
};

// Nộp đơn kháng cáo
const submitAppeal = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.appealUser.id;
    await userService.submitAppeal(userId, reason);
    res.status(201).json({ message: 'Đơn kháng cáo đã được gửi thành công. Vui lòng chờ Admin xử lý.' });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi gửi đơn kháng cáo' });
  }
};

export {
  getUserById,
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getDashboard,
  searchUsers,
  submitAppeal
};
