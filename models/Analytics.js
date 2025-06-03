// models/Analytics.js
const mongoose = require('mongoose');

// 視聴データのスキーマ
const viewSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 }, // 視聴時間（秒）
  completed: { type: Boolean, default: false }, // 視聴完了したかどうか
  source: { type: String }, // 視聴元（SNSなど）
  ipAddress: { type: String }, // IPアドレス（重複排除用）
  deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' } // デバイスタイプ
});

// 分析データのスキーマ
const analyticsSchema = new mongoose.Schema({
  // 対象コンテンツ（作品またはエピソード）
  contentType: { type: String, enum: ['work', 'episode'], required: true },
  contentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'contentType', 
    required: true 
  },
  
  // 視聴データ
  views: [viewSchema],
  
  // 収益データ
  revenue: { type: Number, default: 0 }, // 総収益
  conversions: { type: Number, default: 0 }, // コンバージョン数（購入数）
  
  // リード獲得データ
  leadViews: { type: Number, default: 0 }, // リード視聴数
  leadConversions: { type: Number, default: 0 }, // リードからのコンバージョン数
  
  // 更新日時
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// インデックスを設定
analyticsSchema.index({ contentType: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
