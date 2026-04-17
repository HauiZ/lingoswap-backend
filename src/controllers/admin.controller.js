import adminService from '../services/admin.service.js';
import logger from '../utils/logger.js';

// Lấy tất cả users (Chỉ dành cho admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    logger.log('Admin: Lấy danh sách tất cả users');
    res.json(users);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy danh sách users' });
  }
};

// Khóa (Ban) người dùng vì vi phạm
const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await adminService.banUser(id);
    logger.log(`Admin đã khóa (ban) user ID: ${id}`);
    res.json({ message: 'Đã khóa tài khoản người dùng do vi phạm', user });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi admin khóa user' });
  }
};

// Xóa user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteUser(id);
    logger.log(`Admin yêu cầu xóa user ID: ${id}`);
    res.json({ message: `Đã xóa user có ID: ${id} vĩnh viễn` });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi xóa user' });
  }
};

export {
  getAllUsers,
  banUser,
  deleteUser,
};
