// tests/dbHandler.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

/**
 * Khởi động server MongoDB giả lập trong RAM và kết nối mongoose
 */
export const connect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);
};

/**
 * Ngắt kết nối và đóng server MongoDB giả lập
 */
export const close = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

/**
 * Xóa toàn bộ dữ liệu trong tất cả các collections
 */
export const clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
