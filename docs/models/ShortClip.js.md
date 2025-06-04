# ShortClip.js モデル ドキュメント

## 概要

`ShortClip.js`はショート動画コンテンツを管理するためのMongooseスキーマとモデルです。短尺のビデオクリップ、プロモーション素材などの情報を保存します。

## スキーマ定義

```javascript
// models/ShortClip.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shortClipSchema = new Schema({
  title: {
    type: String,
    required: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
  // 他に userId など必要があれば追加
});

module.exports = mongoose.model('ShortClip', shortClipSchema);
```

## フィールド説明

| フィールド名 | 型 | 説明 | デフォルト値 |
|------------|-----|------|------------|
| `title` | String | クリップのタイトル（必須） | - |
| `episodeTitle` | String | 関連するエピソードのタイトル（任意） | - |
| `description` | String | クリップの説明 | - |
| `tags` | [String] | タグの配列 | - |
| `visibility` | String | 公開設定（'public', 'private', 'unlisted'） | 'public' |
| `cloudinaryUrl` | String | Cloudinary上のコンテンツURL（必須） | - |
| `cloudinaryPublicId` | String | CloudinaryのパブリックID | - |
| `contentType` | String | コンテンツのタイプ（'video'など）（必須） | - |
| `duration` | Number | 再生時間（秒） | 0 |
| `createdAt` | Date | 作成日時 | 現在時刻 |

## 使用例

### 新しいショートクリップを作成する

```javascript
const ShortClip = require('../models/ShortClip');

const newShortClip = new ShortClip({
  title: '新作アニメ予告編',
  episodeTitle: '第1話: 始まりの序章',
  description: '大人気漫画がついにアニメ化！',
  tags: ['アニメ', '予告編', 'アクション'],
  visibility: 'public',
  cloudinaryUrl: 'https://res.cloudinary.com/example/video/upload/v1234/short1.mp4',
  cloudinaryPublicId: 'short1',
  contentType: 'video',
  duration: 45  // 45秒
});

await newShortClip.save();
```

### ショートクリップを検索する

```javascript
// すべてのパブリッククリップを取得
const publicClips = await ShortClip.find({ visibility: 'public' }).sort({ createdAt: -1 });

// タグ検索
const actionClips = await ShortClip.find({ tags: 'アクション' });

// タイトル検索（部分一致）
const searchResults = await ShortClip.find({ 
  title: { $regex: '検索ワード', $options: 'i' } 
});
```

### ショートクリップを更新する

```javascript
await ShortClip.findByIdAndUpdate(clipId, {
  title: '更新後のタイトル',
  description: '更新後の説明',
  tags: ['更新', 'タグ'],
  visibility: 'unlisted'
});
```

### ショートクリップを削除する

```javascript
await ShortClip.findByIdAndDelete(clipId);
```

## 注意事項

- `title`、`cloudinaryUrl`、`contentType`は必須フィールドのため、必ず値を設定すること
- `cloudinaryPublicId`はCloudinaryリソースの削除時に必要なため、できるだけ保存すること
- `visibility`は公開設定を制御し、以下の値を取る：
  - `public`: 誰でも閲覧可能
  - `private`: 作成者のみ閲覧可能
  - `unlisted`: URLを知っている人のみ閲覧可能
- 再生時間は秒数で保存され、表示時に適切なフォーマットに変換する必要がある

## 関連ルート

詳細は`routes/shortsRoutes.js`を参照してください：

- `GET /shorts`: ショートクリップ一覧
- `GET /shorts/new`: 新規ショートクリップ作成フォーム
- `POST /shorts`: 新規ショートクリップ作成
- `GET /shorts/:id`: ショートクリップ詳細
- `PUT /shorts/:id`: ショートクリップ更新
- `DELETE /shorts/:id`: ショートクリップ削除

## プレビュー表示について

ショートクリップのプレビュー表示は次のようなデザインガイドラインに従っています：

- 黒背景のシンプルなデザイン
- 角が丸い表示スタイル（border-radius: 20px）
- プレビュー位置調整（top: 150px）
- タイトルとエピソードタイトルは同一サイズ（font-size: 1rem）
- 説明文は小さめサイズ（0.88em）で2行制限、長文は「続きを見る」トグルで表示
