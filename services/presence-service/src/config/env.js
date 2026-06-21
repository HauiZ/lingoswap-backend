import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT:      process.env.PORT      || 5007,
  NODE_ENV:  process.env.NODE_ENV  || 'development',
  REDIS_URI: process.env.REDIS_URI || 'redis://127.0.0.1:6379',
};

export default env;
