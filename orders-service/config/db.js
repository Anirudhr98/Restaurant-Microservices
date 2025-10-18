const mongooose = require("mongoose");
const logger = require("../lib/logger");

const connectDB = async () => {
  try {
    await mongooose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("Order Service MongoDB connected successfully");
  } catch (err) {
    logger.error("Order Service MongoDB connection error: %o", err);
    process.exit(1);
  }
};

module.exports = connectDB;