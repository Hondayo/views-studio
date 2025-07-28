// models/ShortClip.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shortClipSchema = new Schema({
  title: {
    type: String
    // タイトルはオプショナルに変更（説明文とタグで分離保存のため）
  },
  episodeTitle: {
    type: String // エピソード名（任意）
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
  cloudinaryPublicId: {
    type: String // Cloudinaryのpublic_id
    // 必須にはしない（既存データ対応）
  },
  contentType: {
    type: String, // 'video' など
    required: true
  },
  duration: {
    type: Number, // 秒数など必要に応じて
    default: 0
  },
  // 作品・エピソード関連情報
  workId: {
    type: Schema.Types.ObjectId,
    ref: 'Work' // 関連する作品のID
  },
  workTitle: {
    type: String // 作品タイトル（検索用）
  },
  episodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Episode' // 関連するエピソードのID
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
  // 他に userId など必要があれば追加
});

module.exports = mongoose.model('ShortClip', shortClipSchema);
