const mongoose = require('mongoose');

// Allow Mongoose buffering so initial requests wait for connection without crashing
mongoose.set('bufferCommands', true);

const connectDB = async (retryCount = 0) => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vedanco_ai';
  const urisToTry = [
    primaryUri,
    'mongodb://127.0.0.1:27017/vedanco_ai',
    'mongodb://localhost:27017/vedanco_ai',
  ];

  for (const uri of [...new Set(urisToTry)]) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.warn(`[MongoDB Connection Attempt Failed for ${uri}]: ${error.message}`);
    }
  }

  console.error('[MongoDB Error] All connection attempts failed. Retrying in 5 seconds...');
  setTimeout(() => connectDB(retryCount + 1), 5000);
  return null;
};

module.exports = connectDB;
