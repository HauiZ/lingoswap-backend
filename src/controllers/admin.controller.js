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

const getReports = async (req, res) => {
  try {
    const { status, limit, page } = req.query;
    const reports = await adminService.getAllReports(status, limit, page);
    logger.log('Admin lấy danh sách báo cáo');
    res.json(reports);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi lấy danh sách báo cáo' });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const report = await adminService.resolveReport(id, adminId, req.body);
    logger.log(`Admin ${adminId} đã xử lý báo cáo ID: ${id}`);
    res.json({ message: 'Đã cập nhật trạng thái báo cáo', report });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi xử lý báo cáo' });
  }
};

export {
  getAllUsers,
  banUser,
  deleteUser,
  getReports,
  resolveReport
};
