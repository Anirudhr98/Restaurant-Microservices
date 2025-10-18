// lib/rabbitmq.js
const amqplib = require("amqplib");
const logger = require("./logger");

let channel, conn = null;

async function connect() {
  if (channel) return channel;
  const url = process.env.RABBIT_URL || "amqp://localhost:5672";
  conn = await amqplib.connect(url);
  channel = await conn.createChannel();
  await channel.assertExchange("app.exchange", "topic", { durable: true });
  logger.info("✅ RabbitMQ connected");
  return channel;
}

async function publish(routingKey, message) {
  const ch = await connect();
  ch.publish("app.exchange", routingKey, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
  logger.info(`📤 Message published to ${routingKey}`);
}

async function consume(queueName, bindingKey, handler) {
  const ch = await connect();
  await ch.assertQueue(queueName, { durable: true });
  await ch.bindQueue(queueName, "app.exchange", bindingKey);
  await ch.prefetch(1);

  ch.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const body = JSON.parse(msg.content.toString());
        await handler(body, msg);
        ch.ack(msg);
      } catch (err) {
        logger.error("❌ Consumer handler error", {
          err: err.message,
          bindingKey,
        });
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}

async function close() {
  try {
    await channel?.close();
    await conn?.close();
    logger.info("🔌 RabbitMQ connection closed");
  } catch (err) {
    logger.error("Error closing RabbitMQ connection", err);
  }
}

module.exports = { connect, publish, consume, close };
