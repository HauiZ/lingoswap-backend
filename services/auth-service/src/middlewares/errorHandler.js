import logger from '../utils/logger.js';

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
