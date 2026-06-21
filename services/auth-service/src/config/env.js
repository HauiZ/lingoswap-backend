import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT:                 process.env.PORT                 || 5001,
  NODE_ENV:             process.env.NODE_ENV             || 'development',
  DB_URI:               process.env.DB_URI               || 'mongodb://localhost:27017/lingoswap_auth',
  REDIS_URI:            process.env.REDIS_URI            || 'redis://127.0.0.1:6379',
  JWT_SECRET:           process.env.JWT_SECRET           || 'your-secret-key',
  JWT_EXPIRE:           process.env.JWT_EXPIRE           || '1d',
  JWT_REFRESH_SECRET:   process.env.JWT_REFRESH_SECRET   || 'your-refresh-secret-key',
  JWT_REFRESH_EXPIRE:   process.env.JWT_REFRESH_EXPIRE   || '30d',
  OAUTH_CLIENT_ID:      process.env.OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET:  process.env.OAUTH_CLIENT_SECRET,
  OAUTH_REFRESH_TOKEN:  process.env.OAUTH_REFRESH_TOKEN,
  MY_EMAIL_ACCOUNT:     process.env.MY_EMAIL_ACCOUNT,
  FRONTEND_URL:         process.env.FRONTEND_URL         || 'http://localhost:5173',
};

export default env;
