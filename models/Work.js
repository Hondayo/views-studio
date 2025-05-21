/* Work.js */
const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  thumbnailVideoUrl: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  durationSeconds: {
    type: Number,
    default: 0
  },
  rating: {
    type: String
  },
  releaseDate: {
    type: String
  },
  cast: {
    type: String
  },
  studio: {
    type: String
  }
}, {
  timestamps: true // createdAt, updatedAt を自動で管理
});

module.exports = mongoose.model('Work', workSchema);
