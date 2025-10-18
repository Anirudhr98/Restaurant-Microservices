const amqp = require('amqplib');
const logger = require('./logger');

let channel;

async function connect() {
  if (channel) return channel;
  const conn = await amqp.connect(process.env.RABBIT_URL);
  channel = await conn.createChannel();
  await channel.assertExchange('app.exchange', 'topic', { durable: true });
  logger.info('Connected to RabbitMQ');
  return channel;
}

async function publish(routingKey, message) {
  const ch = await connect();
  const payload = Buffer.from(JSON.stringify(message));
  ch.publish('app.exchange', routingKey, payload, { persistent: true });
  logger.info('Event published', { routingKey });
}

module.exports = { connect, publish };
