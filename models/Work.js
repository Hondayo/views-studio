// models/Work.js
const mongoose = require('mongoose');

const WorkSchema = new mongoose.Schema({
  title:  { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['story', 'single', 'imageStory', 'videoStory', 'singleVideo'],
    required: true
  },
  thumbnailUrl: String,
  tags: [String],
  singleUrl:   String,
  singleType:  { type: String, enum: ['video', 'image'] },
  durationMin: Number,

  // ★ 追加フィールド
  rating:      String, // 例: "G" "PG-12" "R15+" など
  releaseDate: String, // 例: "2023"
  cast:        String, // 例: "佐藤健, 有村架純"
  studio:      String, // 例: "東映アニメーション"
}, { timestamps: true });

module.exports = mongoose.model('Work', WorkSchema);
