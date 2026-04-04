import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

export const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
};