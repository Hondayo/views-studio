# Analytics.js モデル ドキュメント

## 概要

`Analytics.js`はコンテンツ（作品またはエピソード）の視聴データ、収益データ、およびリード獲得データを管理するためのMongooseスキーマとモデルです。分析情報の収集と追跡に使用されます。

## スキーマ定義

```javascript
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
```

## フィールド説明

### viewSchema (埋め込みスキーマ)

| フィールド名 | 型 | 説明 | デフォルト値 |
|------------|-----|------|------------|
| `timestamp` | Date | 視聴した日時 | 現在時刻 |
| `duration` | Number | 視聴時間（秒） | 0 |
| `completed` | Boolean | 視聴完了したかどうか | false |
| `source` | String | 視聴元（SNSなど） | - |
| `ipAddress` | String | 視聴者のIPアドレス | - |
| `deviceType` | String | デバイスタイプ（'mobile', 'tablet', 'desktop'） | 'desktop' |

### analyticsSchema (メインスキーマ)

| フィールド名 | 型 | 説明 | デフォルト値 |
|------------|-----|------|------------|
| `contentType` | String | コンテンツタイプ（'work'または'episode'）（必須） | - |
| `contentId` | ObjectId | 対象コンテンツのID（必須） | - |
| `views` | [viewSchema] | 視聴データの配列 | [] |
| `revenue` | Number | 総収益 | 0 |
| `conversions` | Number | コンバージョン数（購入数） | 0 |
| `leadViews` | Number | リード視聴数 | 0 |
| `leadConversions` | Number | リードからのコンバージョン数 | 0 |
| `updatedAt` | Date | 更新日時 | 現在時刻 |
| `createdAt` | Date | 作成日時（自動生成） | 現在時刻 |

## 使用例

### 分析データの作成／更新

```javascript
const Analytics = require('../models/Analytics');

// 新しい分析データを作成
async function createAnalytics(contentType, contentId) {
  const analytics = new Analytics({
    contentType,  // 'work' または 'episode'
    contentId     // 対象のコンテンツID
  });
  
  return await analytics.save();
}

// 視聴データを追加
async function addView(contentType, contentId, viewData) {
  // 該当するドキュメントを取得or作成
  let analytics = await Analytics.findOne({ contentType, contentId });
  if (!analytics) {
    analytics = new Analytics({ contentType, contentId });
  }
  
  // 視聴データを追加
  analytics.views.push({
    duration: viewData.duration || 0,
    completed: viewData.completed || false,
    source: viewData.source,
    ipAddress: viewData.ipAddress,
    deviceType: viewData.deviceType || 'desktop'
  });
  
  // ドキュメントを保存
  return await analytics.save();
}

// 収益データを更新
async function updateRevenue(contentType, contentId, amount) {
  return await Analytics.findOneAndUpdate(
    { contentType, contentId },
    { 
      $inc: { revenue: amount, conversions: 1 },
      updatedAt: Date.now()
    },
    { upsert: true, new: true }
  );
}
```

### 分析データの取得と集計

```javascript
// 特定コンテンツの分析データを取得
const analytics = await Analytics.findOne({ contentType: 'episode', contentId: episodeId });

// 総視聴数を取得
const totalViews = analytics.views.length;

// 視聴完了数を取得
const completedViews = analytics.views.filter(view => view.completed).length;

// 完了率を計算
const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

// デバイスタイプ別の視聴数を集計
const deviceCounts = analytics.views.reduce((acc, view) => {
  acc[view.deviceType] = (acc[view.deviceType] || 0) + 1;
  return acc;
}, {});
```

### 集計ダッシュボード用のデータ取得

```javascript
// すべての作品の総収益を取得
const revenue = await Analytics.aggregate([
  { $match: { contentType: 'episode' } },
  { $group: { _id: null, total: { $sum: '$revenue' } } }
]);

// 上位視聴コンテンツを取得
const topContent = await Analytics.aggregate([
  { $project: { contentId: 1, contentType: 1, viewCount: { $size: '$views' } } },
  { $sort: { viewCount: -1 } },
  { $limit: 10 }
]);
```

## インデックス

`contentType`と`contentId`のフィールドにユニークな複合インデックスが設定されており、同一コンテンツに対する分析データの重複を防止しています。

```javascript
analyticsSchema.index({ contentType: 1, contentId: 1 }, { unique: true });
```

## 注意事項

- `contentType`は必ず`'work'`または`'episode'`を指定すること（それ以外はバリデーションエラー）
- `contentId`は`contentType`によって参照するモデルが変わる（refPath機能を使用）
- 視聴データは配列として保存されるため、データ量が増えると処理が遅くなる可能性がある
  - 大量の視聴データがある場合は、定期的に集計して別コレクションに保存するなどの対策が必要
- IPアドレスは個人情報保護の観点から、匿名化やハッシュ化を検討すべき

## 関連ルート

詳細は`routes/analyticsRoutes.js`を参照してください：

- `GET /analytics/dashboard`: 管理ダッシュボード
- `POST /analytics/view`: 視聴データの記録
- `GET /analytics/works/:workId`: 作品別分析
- `GET /analytics/episodes/:episodeId`: エピソード別分析
