import logger from '../utils/logger.js';

/**
 * Global error handler middleware - dùng cho tất cả Express services.
 * Phải đặt CUỐI cùng trong app.js, sau tất cả route.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: true,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
