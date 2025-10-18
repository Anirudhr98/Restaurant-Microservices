require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');
const logger = require('./lib/logger');
const rateLimiter = require('./lib/ratelimiter');
const verifyToken = require('./lib/verifyToken');
const { connect, publish } = require('./lib/rabbitmq');

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(rateLimiter);

app.use((req, res, next) => {
    logger.info(`method:${req.method},path:${req.originalUrl}`);
    next();
})

const services = {
  auth: process.env.AUTH_SERVICE_URL,
  order: process.env.ORDER_SERVICE_URL,
  restaurant: process.env.RESTAURANT_SERVICE_URL,
  notification: process.env.NOTIFICATION_SERVICE_URL,
};

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'API Gateway' });
});


// Generic proxy handler
const proxyRequest = async (req, res, targetUrl) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${targetUrl}${req.originalUrl}`,
      data: req.body,
      headers: { 'Content-Type': 'application/json' },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error({ message: 'Proxy error', error: error.message });
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

// Service routes
app.use('/auth', (req, res) => proxyRequest(req, res, services.auth));
app.use('/orders', verifyToken, (req, res) => proxyRequest(req, res, services.order));
app.use('/restaurants', (req, res) => proxyRequest(req, res, services.restaurant));
app.use('/notifications', verifyToken, (req, res) => proxyRequest(req, res, services.notification));

// Error handler
app.use((err,req,res,next) => {
logger.error({message:'Unhandled Error',error:err.message});
res.status(500).json({error:'Something went wrong'});
})


const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  logger.info(`API Gateway running on port ${PORT}`);
  console.log(`API Gateway running on port ${PORT}`);
});

// For testing purposes
module.exports = app;