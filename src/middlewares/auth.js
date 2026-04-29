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
