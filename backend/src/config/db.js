import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

export async function connectDB(uriOverride) {
  let uri = uriOverride || env.mongodbUri;

  if (!uri && env.useInMemoryDb && !env.isProd) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('[DB] Started in-memory MongoDB server for local development.');
  }

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not configured. Provide MONGODB_URI in backend/.env or set USE_IN_MEMORY_DB=true for local development.'
    );
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: !env.isProd,
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
