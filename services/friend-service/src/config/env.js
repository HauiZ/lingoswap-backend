import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT:        process.env.PORT        || 5005,
  NODE_ENV:    process.env.NODE_ENV    || 'development',
  DB_URI:      process.env.DB_URI      || 'mongodb://localhost:27017/lingoswap_friends',
  REDIS_URI:   process.env.REDIS_URI   || 'redis://127.0.0.1:6379',
  JWT_SECRET:  process.env.JWT_SECRET  || 'your-secret-key',
};

export default env;
