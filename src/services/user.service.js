import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

const getUserById = async (id) => {
    const user = await User.findById(id).select('-password -__v -settings -status');
    if (!user) {
        throw new ApiError(404, 'Người dùng không tồn tại');
    }
    return user;
};

const getMyProfile = async (userId) => {
    const user = await User.findById(userId).select('-password -__v');
    return user;
};

const updateMyProfile = async (userId, { profile, settings }) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'Tài khoản không tồn tại');
    }

    if (profile) {
        user.profile = { ...user.profile, ...profile };
    }

    if (settings) {
        user.settings = { ...user.settings, ...settings };
    }

    await user.save();
    return await User.findById(userId).select('-password -__v');
};

const uploadAvatar = async (userId, file) => {
    if (!file) {
        throw new ApiError(400, 'Vui lòng cung cấp file ảnh');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'Tài khoản không tồn tại');
    }

    user.profile.avatar = file.path;
    await user.save();

    return file.path;
};

export default {
    getUserById,
    getMyProfile,
    updateMyProfile,
    uploadAvatar
};
