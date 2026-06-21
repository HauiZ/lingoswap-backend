import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';
import env from '../config/env.js';

/**
 * Middleware xác thực JWT - stateless, không query DB.
 * Chỉ verify JWT signature và kiểm tra Redis blacklist (ban).
 *
 * Sau khi pass, req.user sẽ có: { id, role, iat, exp }
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Kiểm tra Redis Blacklist xem user có bị ban không
    const isBanned = await redis.get(`blacklist:banned:${decoded.id}`);
    if (isBanned) {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    console.error('Lỗi xác thực:', err);
    return res.status(500).json({ error: 'Lỗi xác thực hệ thống' });
  }
};

/**
 * Middleware phân quyền theo role.
 * @param {...string} roles - Danh sách role được phép (ví dụ: 'admin', 'user')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Không có quyền' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Dữ liệu bị cấm: Quyền hạn không đủ' });
    }
    next();
  };
};

export { authenticateToken, authorizeRoles };
