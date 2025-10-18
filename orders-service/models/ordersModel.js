const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuId: { type: String, required: true },
  name: String,
  price: Number,
  qty: { type: Number, default: 1 }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  items: [OrderItemSchema],
  total: { type: Number, required: true },
  status: { type: String, enum: ['created','processing','completed','cancelled'], default: 'created' }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
