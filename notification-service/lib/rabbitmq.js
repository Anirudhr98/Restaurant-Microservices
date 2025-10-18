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

async function consume(routingKey, handler) {
  const ch = await connect();
  const q = await ch.assertQueue('', { exclusive: true });
  await ch.bindQueue(q.queue, 'app.exchange', routingKey);
  ch.consume(q.queue, async msg => {
    if (msg !== null) {
      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        ch.ack(msg);
      } catch (err) {
        logger.error('Error processing message', { message: err.message });
      }
    }
  });
  logger.info(`Listening for ${routingKey} events`);
}

async function close() {
  try { await channel?.close(); await conn?.close(); } catch (e) {}
}

module.exports = { connect, consume, close };
