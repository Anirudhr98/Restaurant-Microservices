require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const { connect: connectRabbitMQ } = require('./lib/rabbitmq');
const logger = require('./lib/logger');


const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());    

//Health check endpoint
app.get('/health', (req, res) => res.send('OK'));

app.use('/api/orders', orderRoutes);

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
  const port = process.env.PORT || 4003;
  app.listen(port, () => logger.info(`Orders Service running on port ${port}`));
})();