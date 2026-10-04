const app = require('./app');
const config = require('./config/config');
const redisService = require('./services/redis.service');
const catalogService = require('./services/catalog.service');
const kafkaService = require('./services/kafka.service');
const analyticsConsumer = require('./consumers/analytics.consumer');

async function bootstrap() {
  console.log('========================================================');
  console.log('   COMMERCE HUB - NODE.JS EXPRESS + REDIS + KAFKA API   ');
  console.log('========================================================');

  // 1. Connect to Redis (Section 10)
  try {
    await redisService.connect();
    console.log(`[STARTUP] Redis client connected at ${config.redis.host}:${config.redis.port}`);
  } catch (err) {
    console.warn(`[STARTUP] Warning: Redis connection delayed or offline (${err.message}). Catalog will seed on reconnect.`);
  }

  // 2. Pre-seed / verify Catalog in Redis at startup (Section 14 & 23)
  try {
    await catalogService.initializeCatalogIfMissing();
  } catch (err) {
    console.warn(`[STARTUP] Warning: Initial catalog seed deferred (${err.message}). Will seed on first GET /api/catalog.`);
  }

  // 3. Connect to Kafka Producer & Consumer
  try {
    await kafkaService.connect();
    await analyticsConsumer.start();
  } catch (err) {
    console.warn(`[STARTUP] Kafka initialization warning (${err.message})`);
  }

  // 4. Start HTTP Server
  const server = app.listen(config.port, () => {
    console.log(`[STARTUP] Express Server running at http://localhost:${config.port}`);
    console.log(`[STARTUP] Products endpoint:   http://localhost:${config.port}/api/products`);
    console.log(`[STARTUP] Categories endpoint: http://localhost:${config.port}/api/categories`);
    console.log(`[STARTUP] Tracking endpoint:   http://localhost:${config.port}/api/analytics/page-view`);
    console.log(`[STARTUP] Health endpoint:     http://localhost:${config.port}/api/health`);
    console.log('========================================================\n');
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Closing server and connections...`);
    server.close(async () => {
      try {
        await analyticsConsumer.stop();
        await kafkaService.disconnect();
        await redisService.disconnect();
      } catch (closeErr) {
        console.warn('[SHUTDOWN] Error during disconnect:', closeErr.message);
      }
      console.log('[SHUTDOWN] Process terminated gracefully.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[FATAL] Failed to bootstrap server:', err);
  process.exit(1);
});
