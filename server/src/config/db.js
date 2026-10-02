const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vedanco_ai';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    console.warn('[MongoDB] Make sure MongoDB Server is running or check your MONGO_URI in .env');
    // We don't exit hard immediately in development to allow diagnostic health checks
    return null;
  }
};

module.exports = connectDB;
