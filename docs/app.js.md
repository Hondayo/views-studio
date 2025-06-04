# app.js ドキュメント

## 概要

`app.js`はViews Studioアプリケーションのエントリーポイントで、Express.jsフレームワークを使用したサーバーの設定と起動を担当します。

## 主要な機能

1. **環境設定の読み込み**: `.env`ファイルから環境変数を読み込む
2. **Expressアプリの初期化**: Expressアプリケーションのインスタンス作成
3. **ミドルウェアの設定**: リクエスト/レスポンス処理のためのミドルウェア設定
4. **テンプレートエンジンの設定**: EJSテンプレートエンジンの設定
5. **静的ファイルのセットアップ**: 静的ファイルディレクトリの指定
6. **データベース接続**: MongoDBへの接続設定
7. **ルートの設定**: アプリケーションのルート定義
8. **サーバーの起動**: 指定ポートでサーバーをリッスン

## ファイル構成

```javascript
// 依存モジュールのインポート
require('dotenv').config();
const express         = require('express');
const expressLayouts  = require('express-ejs-layouts');
const mongoose        = require('mongoose');
const path            = require('path');
const methodOverride  = require('method-override');

// モデルとルートのインポート
const Work    = require('./models/Work');
const Episode = require('./models/Episode');
const contentsRoutes = require('./routes/contentsRoutes');
const shortsRoutes = require('./routes/shortsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Expressアプリの作成
const app = express();

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// レイアウト設定
app.use(expressLayouts);
app.set('layout', 'layout');

// テンプレートと静的ファイルの設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'stylesheet')));
app.use(express.static(path.join(__dirname, 'public'))); 

// データベース接続
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB 接続成功'))
  .catch(err => console.error('MongoDB 接続失敗:', err));

// ルート設定
// ログインルート
app.get("/login", (req, res) => {
  res.render('partials/login', {
    title: 'ログイン',
  });
});

// 他のルートモジュールの使用
app.use('/', contentsRoutes);
app.use('/shorts', shortsRoutes);
app.use('/', analyticsRoutes);

// ホームページルート
app.get('/', async (req, res) => {
  // 統計データ取得
  const totalWorks    = await Work.countDocuments();
  const totalEpisodes = await Episode.countDocuments();
  const paidEpisodes  = await Episode.find({ isPaid: true });
  const totalRevenue  = paidEpisodes.reduce((s, ep) => s + (ep.price || 0), 0);

  // ホームページレンダリング
  res.render('partials/home', {
    layout: 'layout',
    title: 'ホーム',
    pageStyle: 'home',
    stats: { totalWorks, totalEpisodes, totalRevenue }
  });
});

// サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));
```

## 詳細説明

### 1. 依存モジュール

- `dotenv`: 環境変数の読み込み
- `express`: Webフレームワーク
- `express-ejs-layouts`: EJSのレイアウト機能
- `mongoose`: MongoDBのODM
- `path`: ファイルパス操作
- `method-override`: HTTPメソッドオーバーライド（PUT/DELETEサポート）

### 2. ミドルウェア

- `express.json()`: JSONリクエストボディのパース
- `express.urlencoded()`: フォームデータのパース
- `methodOverride('_method')`: POST/GETリクエストでPUT/DELETEを使用可能に

### 3. テンプレートエンジン

- `app.set('view engine', 'ejs')`: EJSを使用
- `app.set('views', path.join(__dirname, 'views'))`: ビューディレクトリ指定
- `app.use(expressLayouts)`: レイアウト機能の有効化
- `app.set('layout', 'layout')`: デフォルトレイアウトの指定

### 4. 静的ファイル

- `app.use(express.static(path.join(__dirname, 'stylesheet')))`: CSSファイル
- `app.use(express.static(path.join(__dirname, 'public')))`: その他静的ファイル

### 5. データベース接続

MongoDB接続文字列は環境変数（`MONGO_URI`）から読み込み、接続成功/失敗をログ出力

### 6. ルート定義

- `/login`: ログインページ
- `/`: ホームページ（統計情報表示）
- `contentsRoutes`: 作品・エピソード関連のルート
- `shortsRoutes`: ショートクリップ関連のルート
- `analyticsRoutes`: 分析関連のルート

### 7. サーバー起動

指定されたポート（環境変数またはデフォルト3000）でサーバーを起動

## エラー対応

1. **MongoDB接続エラー**:
   - `.env`ファイルの`MONGO_URI`が正しいか確認
   - MongoDBサービスが起動しているか確認
   - ネットワーク接続を確認

2. **ポート使用中エラー**:
   - 他のアプリケーションが同じポートを使用していないか確認
   - `.env`ファイルで別のポートを指定

3. **モジュール読み込みエラー**:
   - `npm install`で依存モジュールが正しくインストールされているか確認
   - パッケージの互換性を確認

4. **ルーティングエラー**:
   - インポートされたルートモジュールが正しくエクスポートされているか確認
   - パスの指定が正確かチェック

## 関連ファイル

- **モデル**: `models/Work.js`, `models/Episode.js`
- **ルート**: `routes/contentsRoutes.js`, `routes/shortsRoutes.js`, `routes/analyticsRoutes.js`
- **ビュー**: `views/layout.ejs`, `views/partials/login.ejs`, `views/partials/home.ejs`
- **設定**: `.env`（環境変数）
