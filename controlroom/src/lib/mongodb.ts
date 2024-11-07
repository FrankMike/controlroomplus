import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://admin:password123@localhost:27017/myapp?authSource=admin';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached = (globalThis as any).mongoose as MongooseCache;

if (!cached) {
  cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  try {
    if (cached.conn) {
      console.log('Using cached connection');
      return cached.conn;
    }

    if (!cached.promise) {
      console.log('Creating new connection');
      cached.promise = mongoose.connect(MONGODB_URI);
    }

    cached.conn = await cached.promise;
    console.log('Successfully connected to MongoDB');
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
} 