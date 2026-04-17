import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

const getAllUsers = async () => {
    return await User.find().select('-password -__v').sort({ createdAt: -1 });
};

const banUser = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'Người dùng không tồn tại');
    }
    user.statusAccount = 'banned';
    await user.save();
    return await User.findById(id).select('-password -__v');
};

const deleteUser = async (id) => {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
        throw new ApiError(404, 'Người dùng không tồn tại');
    }
    return deletedUser;
};

export default {
    getAllUsers,
    banUser,
    deleteUser
};
