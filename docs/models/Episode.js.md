# Episode.js モデル ドキュメント

## 概要

`Episode.js`は作品（Work）に属するエピソード情報を定義するMongooseスキーマとモデルです。エピソードのタイトル、番号、コンテンツURL、サムネイル、課金情報などを管理します。

## スキーマ定義

```javascript
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
```

## フィールド説明

| フィールド名 | 型 | 説明 | デフォルト値 |
|------------|-----|------|------------|
| `workId` | ObjectId | 親作品のID（必須）、Work モデルを参照 | - |
| `title` | String | エピソードのタイトル（必須） | - |
| `episodeNumber` | Number | エピソード番号 | - |
| `contentType` | String | コンテンツタイプ（'video' または 'image'） | 'video' |
| `cloudinaryUrl` | String | コンテンツのURL（Cloudinary） | - |
| `thumbnailUrl` | String | サムネイル画像のURL | - |
| `description` | String | エピソードの説明 | - |
| `isPaid` | Boolean | 有料コンテンツかどうか | false |
| `price` | Number | 価格（有料の場合） | 0 |
| `duration` | String | 再生時間（hh:mm:ss形式） | '00:00:00' |
| `createdAt` | Date | 作成日時 | 現在時刻 |

## 使用例

### 新しいエピソードを作成する

```javascript
const Episode = require('../models/Episode');

const newEpisode = new Episode({
  workId: '60d21b4667d0d8992e610c85',  // 親作品のID
  title: 'エピソード1: はじまり',
  episodeNumber: 1,
  contentType: 'video',
  cloudinaryUrl: 'https://res.cloudinary.com/example/video/upload/v1234/episode1.mp4',
  thumbnailUrl: 'https://res.cloudinary.com/example/image/upload/v1234/thumbnail1.jpg',
  description: 'このエピソードでは...',
  isPaid: false,
  duration: '00:25:30'  // 25分30秒
});

await newEpisode.save();
```

### エピソードを検索する

```javascript
// ID検索
const episode = await Episode.findById(episodeId);

// 特定の作品に属するエピソードを検索
const episodes = await Episode.find({ workId: workId }).sort({ episodeNumber: 1 });

// 有料エピソードのみ検索
const paidEpisodes = await Episode.find({ isPaid: true });
```

### エピソードを更新する

```javascript
await Episode.findByIdAndUpdate(episodeId, {
  title: '更新後のタイトル',
  description: '更新後の説明',
  isPaid: true,
  price: 300
});
```

### エピソードを削除する

```javascript
await Episode.findByIdAndDelete(episodeId);

// または特定作品の全エピソードを削除
await Episode.deleteMany({ workId: workId });
```

## 関連モデル

- `Work.js`: エピソードが属する親作品モデル
  - `workId`フィールドで関連付け

## 注意事項

- `workId`と`title`は必須フィールドのため、必ず値を設定すること
- `cloudinaryUrl`はCloudinaryにアップロードされたメディアのURLを保存
- `isPaid`と`price`は課金機能に関連、`isPaid`がtrueの場合はpriceに価格を設定
- `duration`はhh:mm:ss形式の文字列として保存される

## 関連ルート

詳細は`routes/contentsRoutes.js`を参照してください：

- `GET /works/:id/episodes/video`: エピソードアップロードフォーム
- `POST /works/:id/episodes`: エピソード作成
- `GET /works/:workId/episodes/:epId/edit`: エピソード編集フォーム
- `PUT /works/:workId/episodes/:epId/edit`: エピソード更新
- `DELETE /works/:workId/episodes/:epId`: エピソード削除
