# Views Studio 環境構築手順

このドキュメントでは、Views Studioの開発環境をセットアップする手順を説明します。

## 前提条件

以下のソフトウェアがインストールされていることを確認してください：

- Node.js (v14.0.0以上)
- npm (v6.0.0以上)
- MongoDB (v4.4以上)
- Git

## 手順

### 1. リポジトリのクローン

```bash
git clone <リポジトリURL>
cd views-studio
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトのルートディレクトリに`.env`ファイルを作成し、以下の環境変数を設定します：

```
# サーバー設定
PORT=3000
NODE_ENV=development

# MongoDB接続設定
MONGODB_URI=mongodb://localhost:27017/views-studio

# Cloudinary設定
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# セッション設定
SESSION_SECRET=your_session_secret
```

※実際の値は開発チームから提供されるものを使用してください。

### 4. データベースの準備

MongoDBが起動していることを確認します：

```bash
# MongoDBサービスの状態確認
mongod --version

# 必要に応じてMongoDBを起動
# macOSの場合
brew services start mongodb-community

# Linuxの場合
sudo systemctl start mongod
```

### 5. 開発サーバーの起動

```bash
# 開発モードで起動（ファイル変更を監視して自動再起動）
npm run dev

# または通常モードで起動
npm start
```

サーバーが正常に起動すると、以下のようなメッセージが表示されます：

```
Server running on port 3000
Connected to MongoDB
```

ブラウザで http://localhost:3000 にアクセスして、アプリケーションが正常に動作していることを確認してください。

## Cloudinaryのセットアップ

1. [Cloudinary](https://cloudinary.com/)にアカウント登録
2. ダッシュボードからCloud name、API Key、API Secretを取得
3. `.env`ファイルに上記の情報を設定
4. 以下の設定をCloudinaryダッシュボードで行うことを推奨：
   - Upload presets: `views_studio_uploads`（署名なしアップロードを許可）
   - 変換設定: 動画の最大サイズと品質の設定

## トラブルシューティング

### MongoDBに接続できない場合

- MongoDBサービスが起動しているか確認
- `.env`ファイルのMONGODB_URIが正しいか確認
- ネットワーク設定（ファイアウォールなど）を確認

### Cloudinaryアップロードエラー

- Cloudinaryの認証情報が正しいか確認
- アップロード制限（無料プランの場合）を確認
- ネットワーク接続を確認

### npm installでエラーが発生する場合

```bash
# npmキャッシュをクリア
npm cache clean --force

# 再度インストール
npm install
```

## 開発環境のカスタマイズ

### VSCode推奨設定

`.vscode/settings.json`ファイルを作成し、以下の設定を追加することを推奨します：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript"]
}
```

### 推奨拡張機能

- ESLint
- Prettier
- MongoDB for VS Code
- EJS language support

## 次のステップ

環境構築が完了したら、以下のドキュメントを参照して開発を始めることができます：

- [データモデル](../models/README.md)
- [API仕様](../api/README.md)
- [フロントエンド実装](../frontend/README.md)

---

問題が解決しない場合は、開発チームにお問い合わせください。
