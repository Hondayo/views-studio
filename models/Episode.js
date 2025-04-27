// models/Episode.js
const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  workId: { type: mongoose.Schema.Types.ObjectId, ref: 'Work', required: true },
  title: { type: String, required: true },
  episodeNumber: Number,
  contentType: { type: String, enum: ['video', 'image'], default: 'video' },
  cloudinaryUrl: String,
  thumbnailUrl: String,
  description: String,
  isPaid: { type: Boolean, default: false },
  price: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Episode', episodeSchema);
