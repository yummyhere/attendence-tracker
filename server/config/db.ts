import mongoose from 'mongoose';

// Cache connection for serverless (Vercel) warm invocations
let isConnected = false;

export async function connectDB(): Promise<string> {
  // Return early if already connected (serverless connection reuse)
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('[DB] Reusing existing MongoDB connection.');
    return mongoose.connection.host ?? '';
  }

  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error('[DB] MONGODB_URI is not set. Please add it to your environment variables.');
  }

  console.log(`[DB] Connecting to MongoDB Atlas...`);
  await mongoose.connect(uri, {
    dbName: 'office_management',
  });

  isConnected = true;
  console.log('[DB] Connected to MongoDB Atlas successfully.');
  return uri;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
}
