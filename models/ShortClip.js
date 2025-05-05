// models/ShortClip.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shortClipSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  tags: [String],
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  cloudinaryUrl: {
    type: String, // Cloudinary 上のURL
    required: true
  },
  contentType: {
    type: String, // 'video' など
    required: true
  },
  duration: {
    type: Number, // 秒数など必要に応じて
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
  // 他に userId など必要があれば追加
});

module.exports = mongoose.model('ShortClip', shortClipSchema);
