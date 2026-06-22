import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const SOURCE_DB = `${MONGO_URI}/lingoswap`;

const TARGET_DBS = {
  auth: `${MONGO_URI}/lingoswap_auth`,
  user: `${MONGO_URI}/lingoswap_users`,
  chat: `${MONGO_URI}/lingoswap_chat`,
  match: `${MONGO_URI}/lingoswap_match`,
  friend: `${MONGO_URI}/lingoswap_friends`,
  notification: `${MONGO_URI}/lingoswap_notifications`,
  report: `${MONGO_URI}/lingoswap_reports`,
  admin: `${MONGO_URI}/lingoswap_admin`,
};

async function migrate() {
  console.log('🏁 Starting migration to microservices databases...');
  
  // Kết nối DB nguồn
  const sourceConn = await mongoose.createConnection(SOURCE_DB).asPromise();
  console.log('🔌 Connected to source database:', SOURCE_DB);

  // Kết nối DB đích
  const targetConns = {};
  for (const [key, uri] of Object.entries(TARGET_DBS)) {
    targetConns[key] = await mongoose.createConnection(uri).asPromise();
    console.log(`🔌 Connected to target database [${key}]:`, uri);
  }

  // --- Helper sao chép Collection ---
  const copyCollection = async (sourceCollName, targetConn, targetCollName, transformFn = null) => {
    console.log(`📦 Migrating collection: ${sourceCollName} -> ${targetCollName}...`);
    const sourceColl = sourceConn.collection(sourceCollName);
    const targetColl = targetConn.collection(targetCollName);

    // Xoá collection đích trước khi import tránh trùng lặp
    await targetColl.deleteMany({});

    const cursor = sourceColl.find({});
    const docs = [];
    while (await cursor.hasNext()) {
      let doc = await cursor.next();
      if (transformFn) {
        doc = transformFn(doc);
      }
      if (doc) {
        docs.push(doc);
      }
    }

    if (docs.length > 0) {
      await targetColl.insertMany(docs);
      console.log(`✅ Migrated ${docs.length} documents from ${sourceCollName}.`);
    } else {
      console.log(`ℹ️ Collection ${sourceCollName} is empty, skipped.`);
    }
  };

  // 1. Sao chép Users sang Auth Service DB (chỉ giữ auth fields)
  await copyCollection('users', targetConns.auth, 'users', (doc) => {
    return {
      _id: doc._id,
      email: doc.email,
      password: doc.password,
      authProvider: doc.authProvider,
      providerId: doc.providerId,
      role: doc.role,
      statusAccount: doc.statusAccount,
      bannedUntil: doc.bannedUntil,
      profile: {
        fullName: doc.profile?.fullName
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  });

  // 2. Sao chép Users sang User Service DB (đầy đủ các trường)
  await copyCollection('users', targetConns.user, 'users');

  // 3. Sao chép OTPs sang Auth Service DB
  await copyCollection('otps', targetConns.auth, 'otps');

  // 4. Sao chép User Reviews sang User Service DB
  await copyCollection('userreviews', targetConns.user, 'userreviews');

  // 5. Sao chép Appeals sang User Service DB
  await copyCollection('appeals', targetConns.user, 'appeals');

  // 6. Sao chép Conversations sang Chat Service DB
  await copyCollection('conversations', targetConns.chat, 'conversations');

  // 7. Sao chép Messages sang Chat Service DB
  await copyCollection('messages', targetConns.chat, 'messages');

  // 8. Sao chép Match Sessions sang Match Service DB
  await copyCollection('matchsessions', targetConns.match, 'matchsessions');

  // 9. Sao chép Friendships sang Friend Service DB
  await copyCollection('friendships', targetConns.friend, 'friendships');

  // 10. Sao chép Notifications sang Notification Service DB
  await copyCollection('notifications', targetConns.notification, 'notifications');

  // 11. Sao chép Reports sang Report Service DB
  await copyCollection('reports', targetConns.report, 'reports');

  // 12. Sao chép Blacklist Keywords sang Admin Service DB
  await copyCollection('blacklistkeywords', targetConns.admin, 'blacklistkeywords');

  // Đóng tất cả connections
  await sourceConn.close();
  for (const conn of Object.values(targetConns)) {
    await conn.close();
  }

  console.log('🎉 Database migration completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
