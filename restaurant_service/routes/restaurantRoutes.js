const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Restaurant = require('../models/restaurantModel');
const { publish } = require('../lib/rabbitmq');
const router = express.Router();


// Create a new restaurant
router.post('/', async (req, res) => {
  try {
    const { name, description, imageUrl, address, ownerId } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({ message: 'Name and ownerId are required' });
    }

    const restaurant = await Restaurant.create({ name, description, imageUrl, address, ownerId });

    // Publish event to RabbitMQ
    await publish('restaurant.events', {
      type: 'RESTAURANT_CREATED',
      data: { restaurantId: restaurant._id, name: restaurant.name, ownerId: restaurant.ownerId },
    });

    res.status(201).json({ message: 'Restaurant created successfully', restaurant });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  Get all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  Update restaurant
router.put('/:id', async (req, res) => {
  try {
    const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updated) return res.status(404).json({ message: 'Restaurant not found' });

    // Publish event
    await publish('restaurant.events', {
      type: 'RESTAURANT_UPDATED',
      data: { restaurantId: updated._id, updatedFields: req.body },
    });

    res.json({ message: 'Restaurant updated successfully', restaurant: updated });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  Delete restaurant
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Restaurant.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: 'Restaurant not found' });

    // Publish event
    await publish('restaurant.events', {
      type: 'RESTAURANT_DELETED',
      data: { restaurantId: deleted._id },
    });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  MENU MANAGEMENT ROUTES


//  Add menu item
router.post('/:id/menu', async (req, res) => {
  try {
    const { name, price, description, imageUrl } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const menuItem = { name, price, description, imageUrl };
    restaurant.menu.push(menuItem);
    await restaurant.save();

    // Publish event
    await publish('menu.events', {
      type: 'MENU_ITEM_ADDED',
      data: { restaurantId: restaurant._id, menuItem },
    });

    res.status(201).json({ message: 'Menu item added successfully', menuItem });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  Update menu item
router.put('/:id/menu/:menuId', async (req, res) => {
  try {
    const { id, menuId } = req.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const menuItem = restaurant.menu.id(menuId);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });

    Object.assign(menuItem, req.body);
    await restaurant.save();

    // Publish event
    await publish('menu.events', {
      type: 'MENU_ITEM_UPDATED',
      data: { restaurantId: restaurant._id, menuId, updatedFields: req.body },
    });

    res.json({ message: 'Menu item updated successfully', menuItem });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//  Delete menu item
router.delete('/:id/menu/:menuId', async (req, res) => {
  try {
    const { id, menuId } = req.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const menuItem = restaurant.menu.id(menuId);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });

    menuItem.remove();
    await restaurant.save();

    // Publish event
    await publish('menu.events', {
      type: 'MENU_ITEM_DELETED',
      data: { restaurantId: restaurant._id, menuId },
    });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;