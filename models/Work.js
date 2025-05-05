/* Work.js */
const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  // ▼ 既存フィールド (変更せず)
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
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
  },
  isDraft: { type: Boolean, default: false },

  // ▼ 新しく追加したいフィールド
  //    (旧スキーマには無かったが、新たに使いたい項目)
  genre: {
    type: String
  },
  broadcastDate: {
    type: String
  },
  views: {
    type: Number,
    default: 0
  },

  // ▼ 表示制御用フラグ (オプション部分)
  showDescription: {
    type: Boolean,
    default: false
  },
  showGenre: {
    type: Boolean,
    default: false
  },
  showBroadcastDate: {
    type: Boolean,
    default: false
  },
  showViews: {
    type: Boolean,
    default: false
  },

  // 必要に応じてここで showRating, showReleaseDate, showCast, showStudio など追加可能
}, {
  timestamps: true // createdAt, updatedAt を自動で管理
});

module.exports = mongoose.model('Work', workSchema);
