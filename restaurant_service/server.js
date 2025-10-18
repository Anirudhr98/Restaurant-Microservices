require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./lib/logger');
const connectDB = require('./config/db');
const { connect : connectRabbitMQ} = require('./lib/rabbitmq');

const restaurantRoutes = require('./routes/restaurantRoutes');

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

app.get('/health',(req, res) => {
    logger.info('Restauarant Service Health check OK');
    res.json({status: 'ok', service: 'restaurant-service'});
})

app.use('/api/restaurants', restaurantRoutes);

const PORT = process.env.PORT || 5002;

//  Graceful shutdown
async function gracefulShutdown() {
  logger.info('Auth service shutting down...');
  process.exit(0);
}
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
(async () => {
  await connectDB();
  await connectRabbitMQ();
  const port = process.env.PORT || 4001;
  app.listen(port, () => logger.info(`Restaurant Service running on port ${port}`));
})();