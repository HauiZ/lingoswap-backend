import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT:                  process.env.PORT                  || 5002,
  NODE_ENV:              process.env.NODE_ENV              || 'development',
  DB_URI:                process.env.DB_URI                || 'mongodb://localhost:27017/lingoswap_users',
  REDIS_URI:             process.env.REDIS_URI             || 'redis://127.0.0.1:6379',
  JWT_SECRET:            process.env.JWT_SECRET            || 'your-secret-key',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  FRONTEND_URL:          process.env.FRONTEND_URL          || 'http://localhost:5173',
  MY_EMAIL_ACCOUNT:      process.env.MY_EMAIL_ACCOUNT,
};

export default env;
