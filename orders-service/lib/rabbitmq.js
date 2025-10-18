const amqp = require('amqplib');
const logger = require('../lib/logger');

let conn = null;
let channel = null;

async function connect() {
  if (channel) return channel;
  const url = process.env.RABBIT_URL || 'amqp://localhost:5672';
  conn = await amqp.connect(url);
  channel = await conn.createChannel();
  await channel.assertExchange('app.exchange', 'topic', { durable: true });
  logger.info('Connected to RabbitMQ');
  return channel;
}

async function publish(routingKey, message) {
  const ch = await connect();
  ch.publish('app.exchange', routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
  logger.info('Published message', { routingKey });
}

async function close() {
  try { await channel?.close(); await conn?.close(); } catch (e) {}
}

module.exports = { connect, publish, close };
