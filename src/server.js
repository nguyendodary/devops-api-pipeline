const app = require('./app');
const config = require('./config/environment');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const logger = require('./utils/logger');

let isShuttingDown = false;

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`📚 API docs: http://localhost:${config.port}/api-docs`);
      logger.info(`❤️  Health check: http://localhost:${config.port}/health`);
    });

    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      logger.info(`${signal} received. Starting graceful shutdown...`);

      const forceTimeout = setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);

      try {
        await new Promise((resolve) => server.close(resolve));
        await disconnectDatabase();
        logger.info('Server closed');
        clearTimeout(forceTimeout);
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        clearTimeout(forceTimeout);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
