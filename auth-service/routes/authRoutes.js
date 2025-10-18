const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const logger = require('../lib/logger');
const { publish } = require('../lib/rabbitmq');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

//  Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user);

    await publish('user.registered', { userId: user._id, email });
    logger.info('User registered', { email });

    res.status(201).json({ user: { id: user._id, name, email }, token });
  } catch (error) {
    logger.error('Register error', { error: error.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    await publish('user.login', { userId: user._id, email });
    logger.info('User logged in', { email });

    res.json({ user: { id: user._id, name: user.name, email }, token });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
