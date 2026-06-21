import jwt from 'jsonwebtoken';

/**
 * Tạo JWT Access Token (ngắn hạn)
 * @param {string} id   - User ID
 * @param {string} role - User role ('user' | 'admin')
 */
const generateAccessToken = (id, role) => {
    const secret = process.env.JWT_SECRET;
    const expire = process.env.JWT_EXPIRE || '1d';
    return jwt.sign({ id, role }, secret, { expiresIn: expire });
};

/**
 * Tạo JWT Refresh Token (dài hạn)
 * @param {string} id   - User ID
 * @param {string} role - User role ('user' | 'admin')
 */
const generateRefreshToken = (id, role) => {
    const secret = process.env.JWT_REFRESH_SECRET;
    const expire = process.env.JWT_REFRESH_EXPIRE || '30d';
    return jwt.sign({ id, role }, secret, { expiresIn: expire });
};

export { generateAccessToken, generateRefreshToken };
