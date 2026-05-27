import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URI: process.env.DB_URI || 'mongodb://localhost:27017/lingoswap',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  REDIS_URI: process.env.REDIS_URI,
  MY_EMAIL_ACCOUNT: process.env.MY_EMAIL_ACCOUNT,
  MY_EMAIL_APP_PASSWORD: process.env.MY_EMAIL_APP_PASSWORD,
  OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET,
  OAUTH_REFRESH_TOKEN: process.env.OAUTH_REFRESH_TOKEN,
};

export default env;
