import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../../modules/users/entities/User.js';
import redis from '../config/redis.js';

export const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Lỗi xác thực: Không tìm thấy token'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new Error('Người dùng không tồn tại'));
        }

        const isBanned = await redis.get(`blacklist:banned:${user.id}`);
        if (isBanned || user.statusAccount === 'banned') {
            return next(new Error('Lỗi xác thực: Tài khoản đã bị khóa'));
        }

        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Lỗi xác thực: Token không hợp lệ'));
    }
};