import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<string> {
  const customUri = process.env.MONGODB_URI;

  if (customUri && customUri.trim() !== '') {
    try {
      console.log(`[DB] Connecting to provided MONGODB_URI: ${customUri.replace(/\/\/.*@/, '//***:***@')}`);
      await mongoose.connect(customUri, {
        dbName: 'office_management',
      });
      console.log('[DB] Connected to MongoDB successfully.');
      return customUri;
    } catch (err: any) {
      console.warn(`[DB] Failed to connect to MONGODB_URI (${err.message}). Falling back to in-memory MongoDB.`);
    }
  }

  // Initialize embedded MongoDB instance
  console.log('[DB] Starting embedded MongoMemoryServer (database: office_management)...');
  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'office_management',
    },
  });

  const uri = memoryServer.getUri();
  await mongoose.connect(uri, {
    dbName: 'office_management',
  });

  console.log(`[DB] Connected to embedded MongoDB at: ${uri}`);
  return uri;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
