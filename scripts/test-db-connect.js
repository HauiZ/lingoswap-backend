import mongoose from 'mongoose';

async function test() {
  try {
    console.log('Connecting to mongodb://localhost:27017 ...');
    const conn = await mongoose.connect('mongodb://localhost:27017/test', { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

test();
