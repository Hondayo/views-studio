// models/Image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title        : { type: String, default: 'Untitled' },
  cloudinaryUrl: { type: String, required: true },
  publicId     : { type: String, required: true },
  createdAt    : { type: Date,   default: Date.now }
});

module.exports = mongoose.model('Image', imageSchema);
