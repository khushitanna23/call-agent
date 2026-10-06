const mongoose = require('mongoose');

// Allow Mongoose buffering so initial requests wait for connection without crashing
mongoose.set('bufferCommands', true);

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vedanco_ai';
  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Primary Connection Failed] ${error.message}`);
    if (primaryUri !== 'mongodb://127.0.0.1:27017/vedanco_ai') {
      try {
        console.log('[MongoDB] Falling back to local MongoDB (127.0.0.1:27017)...');
        const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/vedanco_ai', {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[MongoDB] Connected successfully to local database: ${fallbackConn.connection.name}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error(`[MongoDB Fallback Connection Error] ${fallbackError.message}`);
      }
    }
    return null;
  }
};

module.exports = connectDB;
