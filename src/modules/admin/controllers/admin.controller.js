import adminService from '../services/admin.service.js';
import logger from '../../../core/utils/logger.js';

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
    const io = req.app.get('io');
    const user = await adminService.banUser(id, io);
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
    const io = req.app.get('io');
    const report = await adminService.resolveReport(id, adminId, req.body, io);
    logger.log(`Admin ${adminId} đã xử lý báo cáo ID: ${id}`);
    res.json({ message: 'Đã cập nhật trạng thái báo cáo', report });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi xử lý báo cáo' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    logger.log('Admin: Lấy dữ liệu dashboard');
    res.json(stats);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy dữ liệu dashboard' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const admin = await adminService.createAdmin(req.body);
    logger.log(`Tài khoản Admin mới được tạo: ${admin.email}`);
    res.status(201).json({
      message: 'Tạo tài khoản Admin thành công',
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.profile.fullName
      }
    });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi tạo tài khoản Admin' });
  }
};

const getAppeals = async (req, res) => {
  try {
    const { status, limit, page } = req.query;
    const appeals = await adminService.getAllAppeals(status, limit, page);
    logger.log('Admin lấy danh sách đơn kháng cáo');
    res.json(appeals);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi lấy danh sách kháng cáo' });
  }
};

const resolveAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const appeal = await adminService.resolveAppeal(id, adminId, req.body);
    logger.log(`Admin ${adminId} đã xử lý kháng cáo ID: ${id}`);
    res.json({ message: 'Đã cập nhật trạng thái đơn kháng cáo', appeal });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi xử lý đơn kháng cáo' });
  }
};

// Thêm từ khóa bị cấm
const addBlacklistKeyword = async (req, res) => {
  try {
    const { keyword } = req.body;
    const adminId = req.user.id;
    const result = await adminService.addBlacklistKeyword(keyword, adminId);
    logger.log(`Admin ${adminId} đã thêm từ khóa cấm: ${keyword}`);
    res.status(201).json({ message: 'Đã thêm từ khóa cấm thành công', keyword: result });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi thêm từ khóa cấm' });
  }
};

// Lấy danh sách từ khóa bị cấm (hỗ trợ phân trang & tìm kiếm)
const getBlacklistKeywords = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await adminService.getBlacklistKeywords({ search, page, limit });
    logger.log('Admin lấy danh sách từ khóa cấm');
    res.json(result);
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi lấy danh sách từ khóa cấm' });
  }
};

// Xóa từ khóa cấm
const deleteBlacklistKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteBlacklistKeyword(id);
    logger.log(`Admin đã xóa từ khóa cấm ID: ${id}`);
    res.json({ message: 'Đã xóa từ khóa cấm thành công' });
  } catch (error) {
    logger.error(error.message);
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi xóa từ khóa cấm' });
  }
};

export {
  getAllUsers,
  banUser,
  deleteUser,
  getReports,
  resolveReport,
  getDashboard,
  createAdmin,
  getAppeals,
  resolveAppeal,
  addBlacklistKeyword,
  getBlacklistKeywords,
  deleteBlacklistKeyword
};
