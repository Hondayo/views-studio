# Views Studio

Web上でマンガや小説などの作品を公開・共有するためのプラットフォーム。
作品の整理、エピソード管理、コンテンツのアップロード、プレビュー表示などの機能を提供します。

## システム概要

Views Studioは次の特徴を持つコンテンツ管理・配信システムです：

- **作品管理**: 複数の作品を整理し、メタデータを編集
- **エピソード管理**: 各作品に複数のエピソードを追加
- **コンテンツアップロード**: 画像や動画コンテンツのCloudinaryへの保存
- **ユーザー体験**: モダンなUI/UXデザインによるコンテンツ表示

詳しい情報は [システム概要ドキュメント](/docs/system/overview.md) をご覧ください。

## 技術スタック

- **フロントエンド**: HTML, CSS, JavaScript (Vanilla JS)
- **バックエンド**: Node.js, Express.js
- **テンプレートエンジン**: EJS
- **データベース**: MongoDB (Mongoose ODM)
- **ストレージ**: Cloudinary (画像・動画)
- **認証**: Express-session

## クイックスタート

### 環境構築

```bash
# リポジトリをクローン
git clone https://github.com/Hondayo/views-studio.git
cd views-studio

# 依存パッケージをインストール
npm install

# .envファイルを作成（以下は例）
echo "MONGODB_URI=mongodb://localhost:27017/views-studio
PORT=3000
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret" > .env

# サーバーを起動
npm start
```

詳しい環境構築手順は [セットアップドキュメント](/docs/system/setup.md) をご覧ください。

## プロジェクト構造

```
views-studio/
├── config/           # 設定ファイル（DB, Cloudinary等）
├── controllers/      # コントローラー
├── models/           # データモデル
├── public/           # 静的ファイル
│   ├── css/          # スタイルシート
│   ├── js/           # クライアントサイドJS
│   └── uploads/      # 一時アップロードファイル
├── routes/           # ルーティング
├── stylesheet/       # 追加スタイル
├── utils/            # ユーティリティ関数
├── views/            # EJSテンプレート
│   └── partials/     # 部分テンプレート
└── docs/             # ドキュメント
```

## ドキュメント

より詳細な情報は以下のドキュメントを参照してください：

### システム

- [システム概要](/docs/system/overview.md)
- [環境構築方法](/docs/system/setup.md)
- [プロジェクト構造概要](/docs/プロジェクト構造概要.md)

### バックエンド

- [バックエンド実装](/docs/backend/README.md)
- [API仕様](/docs/api/README.md)
- [モデル設計](/docs/models/README.md)
  - [Work モデル](/docs/models/Work.js.md)
  - [Episode モデル](/docs/models/Episode.js.md)
  - [ShortClip モデル](/docs/models/ShortClip.js.md)
  - [Analytics モデル](/docs/models/Analytics.js.md)
- [ルーティング](/docs/routes/contentsRoutes.js.md)

### フロントエンド

- [フロントエンド実装](/docs/frontend/README.md)
- [アプリケーションメイン](/docs/app.js.md)

### その他

- [テスト戦略](/docs/testing/README.md)
- [デプロイメント](/docs/deployment/README.md)
- [トラブルシューティング](/docs/troubleshooting/README.md)

## 開発

プロジェクトへの貢献を検討される場合は、まずシステム概要と各種ドキュメントをご覧ください。
全体像を把握した上で、各機能の詳細な実装方法については個別のドキュメントを参照してください。

## ライセンス

このプロジェクトは [MITライセンス](LICENSE) の下で公開されています。