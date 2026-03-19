// src/controllers/user.controller.js - Xử lý logic user cá nhân
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Lấy user theo ID (Xem public profile)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.log(`Xem profile public user ID: ${id}`);

    const user = await User.findById(id).select('-password -__v -settings -status');
    // Chú ý: Public profile không trả về settings hoặc dữ liệu nhạy cảm
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    res.json(user);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin user' });
  }
};

// Lấy hồ sơ của user đang đăng nhập hiện tại
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v');
    res.json(user);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi khi lấy hồ sơ cá nhân' });
  }
}

// Cập nhật hồ sơ cá nhân (Chỉ được phép tự update mình)
const updateMyProfile = async (req, res) => {
  try {
    const { profile, settings } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    logger.log(`Cập nhật hồ sơ cá nhân thành công ID: ${req.user.id}`);
    res.json({ message: 'Cập nhật hồ sơ thành công', user: await User.findById(req.user.id).select('-password -__v') });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi khi cập nhật hồ sơ' });
  }
};

// Upload avatar lên Cloudinary
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng cung cấp file ảnh' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    user.profile.avatar = req.file.path; // URL từ Cloudinary
    await user.save();

    logger.log(`Cập nhật avatar thành công ID: ${req.user.id}`);
    res.json({ message: 'Cập nhật avatar thành công', avatarUrl: req.file.path });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'Lỗi khi upload avatar' });
  }
};

export {
  getUserById,
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
};
