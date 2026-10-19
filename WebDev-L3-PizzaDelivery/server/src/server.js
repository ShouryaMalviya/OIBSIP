import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initMailer } from './config/mail.js';

const startServer = async () => {
  try {
    console.log('\n======================================================');
    console.log(`🍕 Starting PizzaVerse Backend Server in ${env.NODE_ENV.toUpperCase()} mode...`);
    console.log('======================================================\n');

    // 1. Connect to Database
    await connectDB();

    // 2. Initialize Mailer Transporter
    await initMailer();

    // 3. Start listening on configured port
    const server = app.listen(env.PORT, () => {
      console.log(`\n🚀 PizzaVerse API Server successfully running on: http://localhost:${env.PORT}`);
      console.log(`👉 Health check URL: http://localhost:${env.PORT}/api/health`);
      console.log(`👉 Client origin allowed: ${env.CLIENT_URL}\n`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
      server.close(async () => {
        console.log('[SHUTDOWN] HTTP server closed.');
        await disconnectDB();
        console.log('[SHUTDOWN] Process exited cleanly.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds if not closed
      setTimeout(() => {
        console.error('[SHUTDOWN] Forceful shutdown initiated after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('[FATAL] Failed to bootstrap PizzaVerse server:', error);
    process.exit(1);
  }
};

startServer();
