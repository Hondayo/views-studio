# バックエンド実装ガイド

このドキュメントでは、Views Studioのバックエンド実装について説明します。
バックエンドはNode.js/Express.jsで構築され、MongoDBをデータベースとして使用しています。

## 目次

1. [アプリケーション構造](#アプリケーション構造)
2. [ルーティング](#ルーティング)
3. [コントローラー](#コントローラー)
4. [ミドルウェア](#ミドルウェア)
5. [データベース操作](#データベース操作)
6. [ファイル処理](#ファイル処理)
7. [エラーハンドリング](#エラーハンドリング)

## アプリケーション構造

```
views-studio/
├── app.js                # アプリケーションのエントリーポイント
├── models/               # データモデル定義
│   ├── Work.js           # 作品モデル
│   ├── Episode.js        # エピソードモデル
│   └── ...
├── routes/               # ルート定義
│   ├── contentsRoutes.js # コンテンツ関連ルート
│   ├── userRoutes.js     # ユーザー関連ルート
│   └── ...
├── middleware/           # カスタムミドルウェア
│   ├── auth.js           # 認証ミドルウェア
│   └── ...
└── utils/                # ユーティリティ関数
    ├── cloudinary.js     # Cloudinary連携
    └── ...
```

### app.js

アプリケーションのエントリーポイントとなるファイルです。Express.jsの初期化、ミドルウェアの設定、ルートの登録、エラーハンドリングなどを行います。

```javascript
const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');
const app = express();

// ミドルウェアの設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));  // PUT/DELETEメソッドのオーバーライド
app.use(express.static(path.join(__dirname, 'public')));

// テンプレートエンジンの設定
app.set('view engine', 'ejs');

// ルートの登録
app.use('/', require('./routes/contentsRoutes'));
app.use('/users', require('./routes/userRoutes'));

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('サーバーエラーが発生しました');
});

// サーバーの起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## ルーティング

ルートファイルでは、HTTPリクエストのパスとメソッドに応じたハンドラ関数を定義します。

### contentsRoutes.js

コンテンツ（作品、エピソード、ショートクリップ）に関するルートを定義します。

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { asyncHandler } = require('../utils/errorHandlers');
const Work = require('../models/Work');
const Episode = require('../models/Episode');

// 作品一覧表示
router.get('/works', asyncHandler(async (req, res) => {
  const works = await Work.find().sort({ createdAt: -1 });
  res.render('works/index', { works });
}));

// 作品詳細表示
router.get('/works/:id', asyncHandler(async (req, res) => {
  const work = await Work.findById(req.params.id);
  const episodes = await Episode.find({ work: req.params.id }).sort({ order: 1 });
  res.render('works/detail', { work, episodes });
}));

// 作品登録フォーム表示
router.get('/works/new', (req, res) => {
  res.render('works/new');
});

// 作品登録処理
router.post('/works', 
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'thumbnailVideo', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    // 作品登録処理
    // ...
    res.redirect('/works');
  })
);

// 作品更新処理
router.put('/works/:id', 
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'thumbnailVideo', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    // 作品更新処理
    // ...
    res.redirect(`/works/${req.params.id}`);
  })
);

// エピソード関連のルート
// ...

module.exports = router;
```

### メソッドオーバーライド

HTMLフォームからPUT/DELETEリクエストを送信するために、`method-override`ミドルウェアを使用しています。

以下の2つの方法でメソッドをオーバーライドできます：

1. クエリパラメータを使用：
```
<form action="/works/123?_method=PUT" method="POST">
```

2. 隠しフィールドを使用：
```
<form action="/works/123" method="POST">
  <input type="hidden" name="_method" value="PUT">
</form>
```

## コントローラー

Views Studioでは、ルートハンドラ内に直接ビジネスロジックを記述していますが、大規模なアプリケーションでは、ロジックをコントローラーに分離することが推奨されます。

### コントローラーの例

```javascript
// controllers/workController.js
const Work = require('../models/Work');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.getAllWorks = async (req, res) => {
  const works = await Work.find().sort({ createdAt: -1 });
  res.render('works/index', { works });
};

exports.getWorkById = async (req, res) => {
  const work = await Work.findById(req.params.id);
  const episodes = await Episode.find({ work: req.params.id }).sort({ order: 1 });
  res.render('works/detail', { work, episodes });
};

exports.createWork = async (req, res) => {
  const { title, description, releaseDate, rating, cast, studio, tags } = req.body;
  
  // 新しい作品の作成
  const work = new Work({
    title,
    description,
    releaseDate,
    rating,
    cast,
    studio,
    tags: parseTags(tags)
  });
  
  // サムネイル画像のアップロード
  if (req.files?.thumbnail?.[0]) {
    const thumbRes = await uploadToCloudinary(req.files.thumbnail[0], 'thumbnails');
    work.thumbnailUrl = thumbRes.secure_url;
  }
  
  // サムネイル動画のアップロード
  if (req.files?.thumbnailVideo?.[0]) {
    const vidRes = await uploadToCloudinary(req.files.thumbnailVideo[0], 'thumbnails');
    work.thumbnailVideoUrl = vidRes.secure_url;
  }
  
  // 作品の保存
  await work.save();
  
  // リダイレクト
  res.redirect('/works');
};

// その他のコントローラーメソッド
// ...
```

## ミドルウェア

Express.jsアプリケーションでは、リクエスト処理のパイプラインにミドルウェア関数を挿入できます。

### 主要なミドルウェア

1. **express.json()**: JSONリクエストボディの解析
2. **express.urlencoded()**: フォームデータの解析
3. **method-override**: HTTPメソッドのオーバーライド
4. **multer**: ファイルアップロード処理

### カスタムミドルウェアの例

```javascript
// middleware/auth.js
const auth = (req, res, next) => {
  // 認証チェック
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

module.exports = auth;
```

## データベース操作

Mongooseを使用してMongoDBとの連携を行います。

### モデルの定義

```javascript
// models/Work.js
const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  thumbnailUrl: String,
  thumbnailVideoUrl: String,
  releaseDate: Date,
  rating: String,
  cast: String,
  studio: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新時にupdatedAtを自動更新
workSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Work', workSchema);
```

### データベース操作の例

```javascript
// 作品の取得
const works = await Work.find().sort({ createdAt: -1 });

// 特定の作品の取得
const work = await Work.findById(id);

// 作品の作成
const work = new Work({ title, description, ... });
await work.save();

// 作品の更新
await Work.findByIdAndUpdate(id, update);

// 作品の削除
await Work.findByIdAndDelete(id);
```

## ファイル処理

ファイルアップロードには`multer`ミドルウェアを使用し、アップロードされたファイルはCloudinaryに保存します。

### multerの設定

```javascript
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });
```

### Cloudinaryへのアップロード

```javascript
// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Cloudinaryの設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ファイルアップロード関数
const uploadToCloudinary = async (file, folder) => {
  try {
    // Cloudinaryにアップロード
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'auto'
    });
    
    // 一時ファイルの削除
    fs.unlinkSync(file.path);
    
    return result;
  } catch (error) {
    // エラー時も一時ファイルを削除
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

module.exports = { uploadToCloudinary };
```

## エラーハンドリング

非同期関数でのエラーハンドリングを簡略化するためのユーティリティ関数：

```javascript
// utils/errorHandlers.js
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
```

グローバルエラーハンドラ：

```javascript
// app.js
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // 開発環境ではエラー詳細を表示
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      success: false,
      error: {
        message: err.message,
        stack: err.stack
      }
    });
  }
  
  // 本番環境ではシンプルなエラーメッセージを表示
  res.status(500).send('サーバーエラーが発生しました');
});
```

## 次のステップ

バックエンド実装の詳細については、以下のドキュメントを参照してください：

- [ルーティング詳細](./routing.md)
- [データモデル詳細](../models/README.md)
- [ファイル処理詳細](./file-handling.md)
- [エラーハンドリング詳細](./error-handling.md)
