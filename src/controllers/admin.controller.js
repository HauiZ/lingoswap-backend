// src/controllers/admin.controller.js - Xử lý logic dành riêng cho Admin
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Lấy tất cả users (Chỉ dành cho admin)
const getAllUsers = async (req, res) => {
  try {
    logger.log('Admin: Lấy danh sách tất cả users');
    const users = await User.find().select('-password -__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách users' });
  }
};

// Khóa (Ban) người dùng vì vi phạm
const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    // Đổi trạng thái thành banned
    user.status = 'banned';
    await user.save();
    
    logger.log(`Admin đã khóa (ban) user ID: ${id}`);
    res.json({ message: 'Đã khóa tài khoản người dùng do vi phạm', user: await User.findById(id).select('-password -__v') });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi khi admin khóa user' });
  }
};

// Xóa user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.log(`Admin yêu cầu xóa user ID: ${id}`);
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    res.json({ message: `Đã xóa user có ID: ${id} vĩnh viễn` });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi khi xóa user' });
  }
};

export {
  getAllUsers,
  banUser,
  deleteUser,
};
