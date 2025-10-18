require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const logger = require('./lib/logger');
const { consume, close } = require('./lib/rabbitmq');

const app = express();
app.use(express.json());
app.use(helmet());


// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// RabbitMQ consumer for order.created
async function handleOrderCreated(event) {
  logger.info('Received order.created event', { orderId: event.data.orderId, items: event.data.items });
  // In real app, we weould trigger email/SMS here
}

async function start() {
  const port = process.env.PORT || 4004;

  // Start HTTP server
  const server = app.listen(port, () => logger.info(`Notification service running on ${port}`));

  // Connect & consume RabbitMQ messages
  await consume('order.created', handleOrderCreated);

  // Graceful shutdown
  async function shutdown() {
    logger.info('Shutting down notification service...');
    server.close(async () => {
      await close();
      process.exit(0);
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(err => {
  logger.error('Startup error', { message: err.message });
  process.exit(1);
});
