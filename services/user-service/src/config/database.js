import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.DB_URI);
    console.log(`✅ [User Service] MongoDB connected: ${conn.connection.host} — DB: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ [User Service] MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
