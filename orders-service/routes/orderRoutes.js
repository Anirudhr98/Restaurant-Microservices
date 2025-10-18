const express = require('express');
const Order = require('../models/ordersModel');
const { publish } = require('../lib/rabbitmq');
const logger = require('../lib/logger');

const router = express.Router();

 // Create order
router.post('/', async (req, res) => {
  try {
    const { userId, restaurantId, items, total } = req.body;
    if (!userId || !restaurantId || !Array.isArray(items) || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order = await Order.create({ userId, restaurantId, items, total });

    // Publish event to RabbitMQ
    await publish('order.created', {
      version: 1,
      event: 'order.created',
      data: {
        orderId: order._id,
        restaurantId,
        userId,
        items,
        total
      },
      metadata: { createdAt: new Date() }
    });

    logger.info('Order created', { orderId: order._id });
    res.status(201).json({ order });
  } catch (err) {
    logger.error('Create order error', { message: err.message });
    res.status(500).json({ error: 'Unable to create order' });
  }
});

/**
 * Get all orders
 */
router.get('/', async (_, res) => {
  try {
    const orders = await Order.find().lean();
    res.json({ orders });
  } catch (err) {
    logger.error('Fetch orders error', { message: err.message });
    res.status(500).json({ error: 'Unable to fetch orders' });
  }
});

/**
 * Get single order by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    logger.error('Fetch order error', { message: err.message });
    res.status(500).json({ error: 'Unable to fetch order' });
  }
});

module.exports = router;
