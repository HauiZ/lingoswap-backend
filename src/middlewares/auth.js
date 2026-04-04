import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token không tồn tại' });
  }

  jwt.verify(token, env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ' });
    }
    if (user.statusAccount === 'banned') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }
    req.user = user;
    next();
  });
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

export { authenticateToken, authorizeRoles };
