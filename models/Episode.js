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
  price:  { type: Number, default: 0 },
  duration: { 
  type: String, 
  default: '00:00:00'  // hh:mm:ss形式で保持
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Episode', episodeSchema);
