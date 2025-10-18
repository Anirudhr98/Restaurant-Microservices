const mongoose = require('mongoose');
const logger = require('../lib/logger');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        });
        logger.info('Auth Service MongoDB connected');
    } catch (error) {
        logger.error('Auth Service MongoDB connection error:', error);
        process.exit(1);
    }
    }
module.exports = connectDB;
    