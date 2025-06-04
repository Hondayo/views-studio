# Work.js モデル ドキュメント

## 概要

`Work.js`は作品（コンテンツ）の基本情報を定義するMongooseスキーマとモデルです。各作品のタイトル、説明、サムネイル、タグ、メタデータなどを管理します。

## スキーマ定義

```javascript
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
```

## フィールド説明

| フィールド名 | 型 | 説明 | デフォルト値 |
|------------|-----|------|------------|
| `title` | String | 作品のタイトル（必須） | - |
| `description` | String | 作品の説明・あらすじ | - |
| `thumbnailUrl` | String | サムネイル画像のURL | `''`（空文字） |
| `thumbnailVideoUrl` | String | サムネイル動画のURL | `''`（空文字） |
| `tags` | [String] | タグの配列 | - |
| `durationSeconds` | Number | 総時間（秒） | `0` |
| `rating` | String | 年齢制限・評価 | - |
| `releaseDate` | String | 公開日 | - |
| `cast` | String | キャスト情報 | - |
| `studio` | String | 制作スタジオ情報 | - |
| `createdAt` | Date | 作成日時（自動生成） | 現在時刻 |
| `updatedAt` | Date | 更新日時（自動生成） | 現在時刻 |

## 使用例

### 新しい作品を作成する

```javascript
const Work = require('../models/Work');

const newWork = new Work({
  title: '新しい作品タイトル',
  description: '作品の説明文...',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  tags: ['アクション', 'コメディ'],
  rating: 'G',
  releaseDate: '2023-01-01'
});

await newWork.save();
```

### 作品を検索する

```javascript
// ID検索
const work = await Work.findById(workId);

// タイトル検索
const works = await Work.find({ title: { $regex: '検索ワード', $options: 'i' } });

// 最新順に全作品取得
const allWorks = await Work.find().sort({ createdAt: -1 });
```

### 作品を更新する

```javascript
await Work.findByIdAndUpdate(workId, {
  title: '更新後のタイトル',
  description: '更新後の説明'
});
```

### 作品を削除する

```javascript
await Work.findByIdAndDelete(workId);
```

## 関連モデル

- `Episode.js`: 作品に属するエピソードモデル
  - `workId`フィールドで`Work`モデルを参照

## 注意事項

- `title`フィールドは必須項目のため、必ず値を設定すること
- 画像・動画のURLは、Cloudinaryなどのストレージサービスから取得したURLを保存
- `timestamps: true`によって`createdAt`と`updatedAt`が自動的に管理される
- MongoDBの`_id`フィールドは自動生成される識別子

## 関連ルート

詳細は`routes/contentsRoutes.js`を参照してください：

- `GET /contents`: 全作品一覧
- `GET /works/new`: 新規作品作成フォーム
- `POST /works`: 新規作品作成
- `GET /works/:id`: 作品詳細
- `GET /works/:id/edit`: 作品編集フォーム
- `PUT /works/:id`: 作品更新
- `DELETE /works/:id`: 作品削除
