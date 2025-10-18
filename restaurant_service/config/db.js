const {mongoose} = require('mongoose');
const logger = require('../lib/logger');


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,      
            useUnifiedTopology: true
        });
        logger.info('REstuarant Service MongoDB connected');
    } catch (error) {
        logger.error('Restauarant Service MongoDB connection error:', error);
        process.exit(1);
    }   
}

module.exports = connectDB;