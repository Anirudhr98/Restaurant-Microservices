const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  available: { type: Boolean, default: true },
  menuId: { type: String, required: true, unique: true } // simple unique id for items
}, { _id: false });

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  address: String,
  ownerId: String, 
  menu: { type: [MenuItemSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
