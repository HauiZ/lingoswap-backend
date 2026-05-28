import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import redis from '../config/redis.js';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token không tồn tại' });
  }

  try {
    const user = jwt.verify(token, env.JWT_SECRET);
    
    // Kiểm tra Redis Blacklist xem user có bị ban không
    const isBanned = await redis.get(`blacklist:banned:${user.id}`);
    if (isBanned || user.statusAccount === 'banned') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    req.user = user;
    next();
  } catch (err) {
    // Nếu token hết hạn hoặc không hợp lệ, jwt.verify sẽ văng lỗi vào đây
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    // Lỗi từ Redis hoặc lỗi hệ thống khác
    console.error('Lỗi xác thực:', err);
    return res.status(500).json({ error: 'Lỗi xác thực hệ thống' });
  }
};

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

const verifyAppealToken = (req, res, next) => {
  const { appealToken } = req.body;
  if (!appealToken) {
    return res.status(400).json({ error: 'Vui lòng cung cấp token kháng cáo' });
  }

  jwt.verify(appealToken, env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(400).json({ error: 'Token kháng cáo không hợp lệ hoặc đã hết hạn' });
    }
    if (decoded.type !== 'appeal' || !decoded.id) {
      return res.status(400).json({ error: 'Token không đúng định dạng' });
    }
    req.appealUser = { id: decoded.id };
    next();
  });
};

export { authenticateToken, authorizeRoles, verifyAppealToken };
