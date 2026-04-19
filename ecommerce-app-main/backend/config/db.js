/**
 * ===========================================
 * DATABASE CONNECTION CONFIGURATION
 * ===========================================
 * 
 * This module handles MongoDB connection using Mongoose.
 * It connects to a LOCAL MongoDB instance.
 * 
 * Prerequisites:
 * 1. Install MongoDB locally: https://www.mongodb.com/try/download/community
 * 2. Start MongoDB service:
 *    - Windows: Start 'MongoDB Server' from Services
 *    - Mac/Linux: sudo systemctl start mongod
 * 3. MongoDB should be running on mongodb://localhost:27017
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      // These options are no longer needed in Mongoose 6+
      // but included for older versions compatibility
    };

    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

    console.log('📡 Connecting to MongoDB...');
    console.log(`📍 Connection URI: ${mongoURI.replace(/\/\/.*@/, '//<credentials>@')}`);

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ✅ MongoDB Connected Successfully!                       ║
║                                                            ║
║   🗄️  Host: ${conn.connection.host}                            ║
║   📦 Database: ${conn.connection.name}                          ║
║   🔌 Port: ${conn.connection.port}                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📴 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ❌ MongoDB Connection Failed!                            ║
║                                                            ║
║   Error: ${error.message.substring(0, 45)}...
║                                                            ║
║   Troubleshooting Steps:                                   ║
║   1. Ensure MongoDB is installed locally                   ║
║   2. Start MongoDB service                                 ║
║   3. Check if MongoDB is running on port 27017             ║
║   4. Verify connection string in .env file                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    
    throw error;
  }
};

module.exports = connectDB;
