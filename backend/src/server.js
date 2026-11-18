import { env, validateProductionEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { ensureCoreDefaults } from './seed/bootstrapProduction.js';

async function start() {
  try {
    validateProductionEnv();
    await connectDB();
    console.log('[DB] Connected to MongoDB.');

    // Always ensure baseline org settings & role permission matrices exist (never seeds demo records)
    await ensureCoreDefaults();

    const app = createApp();
    const server = app.listen(env.port, () => {
      console.log(`[API] WorkTrack server running on http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
    });

    const shutdown = async () => {
      console.log('[API] Shutting down gracefully...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[API] Failed to start server:', err);
    process.exit(1);
  }
}

start();
