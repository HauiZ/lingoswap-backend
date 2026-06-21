import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';
import env from '../config/env.js';

/**
 * JWT middleware — verify token và kiểm tra Redis blacklist ban
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token không tồn tại' });

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const isBanned = await redis.get(`blacklist:banned:${decoded.id}`);
    if (isBanned) return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    console.error('[Auth] Auth error:', err);
    return res.status(500).json({ error: 'Lỗi xác thực hệ thống' });
  }
};

export { authenticateToken };
