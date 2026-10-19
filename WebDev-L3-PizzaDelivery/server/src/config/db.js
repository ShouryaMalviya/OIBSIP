import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export const connectDB = async () => {
  if (env.USE_MEMORY_DB) {
    console.log('[DB] USE_MEMORY_DB enabled. Operating with fast Zero-Config In-Memory Store.');
    return;
  }

  try {
    console.log(`[DB] Attempting connection to MongoDB at: ${env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);

    // Set 2-second timeout for rapid failover in dev if local daemon is not running
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });

    isConnected = true;
    console.log(`[DB] Successfully connected to live MongoDB: ${mongoose.connection.name}`);
  } catch (error) {
    console.warn(`[DB] Notice: Could not connect to MongoDB daemon (${error.message}).`);

    if (env.NODE_ENV === 'development') {
      console.log('\n========================================================================');
      console.log('⚡ [DB NOTICE] Fast Zero-Config In-Memory Storage Active');
      console.log('   All registration, password hashing, email verification, and JWT logins');
      console.log('   are 100% functional in memory. No external MongoDB install required.');
      console.log('   To connect to a live MongoDB, update MONGODB_URI in server/.env.');
      console.log('========================================================================\n');
      isConnected = false;
      return;
    }

    console.error('[DB] Critical: MongoDB connection failed in production mode.');
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    if (isConnected) {
      await mongoose.disconnect();
      console.log('[DB] MongoDB disconnected cleanly.');
    }
  } catch (error) {
    console.error('[DB] Error during MongoDB disconnect:', error);
  }
};

export const isDbConnected = () => isConnected;
