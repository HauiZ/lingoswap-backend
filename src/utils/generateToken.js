import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRE,
    });
};

const generateRefreshToken = (id, role) => {
    return jwt.sign({ id, role }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRE,
    });
};

export { generateAccessToken, generateRefreshToken };