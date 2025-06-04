# デプロイメントガイド

このドキュメントでは、Views Studioを本番環境にデプロイするための手順と推奨事項について説明します。

## 目次

1. [デプロイ前の準備](#デプロイ前の準備)
2. [本番環境の要件](#本番環境の要件)
3. [デプロイ手順](#デプロイ手順)
4. [環境変数の設定](#環境変数の設定)
5. [セキュリティ対策](#セキュリティ対策)
6. [パフォーマンス最適化](#パフォーマンス最適化)
7. [監視とメンテナンス](#監視とメンテナンス)

## デプロイ前の準備

### コードの準備

1. **依存関係の整理**
   - 不要な依存関係を削除
   - 開発用依存関係と本番用依存関係を分離
   ```json
   "dependencies": {
     // 本番環境で必要なパッケージ
   },
   "devDependencies": {
     // 開発時のみ必要なパッケージ
   }
   ```

2. **環境変数の確認**
   - すべての機密情報（APIキー、パスワードなど）が環境変数として設定されていることを確認
   - ハードコードされた設定値がないことを確認

3. **テストの実行**
   - すべてのテストが通過することを確認
   ```bash
   npm test
   ```

4. **本番ビルド**
   - 必要に応じて本番用ビルドを作成
   ```bash
   npm run build
   ```

### データベースの準備

1. **データベースのバックアップ**
   - 既存のデータがある場合はバックアップを作成
   ```bash
   mongodump --uri="mongodb://localhost:27017/views-studio" --out=./backup
   ```

2. **インデックスの確認**
   - パフォーマンスを向上させるために必要なインデックスが設定されていることを確認
   ```javascript
   // 例: タイトルと作成日でのソートが頻繁に行われる場合
   workSchema.index({ title: 1, createdAt: -1 });
   ```

## 本番環境の要件

### サーバー要件

- **Node.js**: v14.0.0以上
- **メモリ**: 最低2GB RAM（推奨: 4GB以上）
- **ストレージ**: 最低20GB（メディアファイルの量に応じて増加）
- **CPU**: 最低2コア（推奨: 4コア以上）

### データベース要件

- **MongoDB**: v4.4以上
- **ストレージ**: 最低10GB（データ量に応じて増加）
- **メモリ**: 最低2GB RAM

### ネットワーク要件

- **帯域幅**: 動画ストリーミングを考慮した十分な帯域幅
- **ドメイン**: SSL証明書を設定可能な独自ドメイン
- **CDN**: 静的ファイル配信用のCDN（オプション）

## デプロイ手順

### クラウドプラットフォームへのデプロイ

#### Herokuの場合

1. **Heroku CLIのインストール**
   ```bash
   npm install -g heroku
   ```

2. **Herokuへのログイン**
   ```bash
   heroku login
   ```

3. **アプリケーションの作成**
   ```bash
   heroku create views-studio
   ```

4. **MongoDBアドオンの追加**
   ```bash
   heroku addons:create mongodb:standard
   ```

5. **環境変数の設定**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
   heroku config:set CLOUDINARY_API_KEY=your_api_key
   heroku config:set CLOUDINARY_API_SECRET=your_api_secret
   # その他の必要な環境変数
   ```

6. **デプロイ**
   ```bash
   git push heroku main
   ```

#### AWS Elastic Beanstalkの場合

1. **AWS CLIのインストール**
   ```bash
   pip install awscli
   ```

2. **AWS認証情報の設定**
   ```bash
   aws configure
   ```

3. **Elastic Beanstalk CLIのインストール**
   ```bash
   pip install awsebcli
   ```

4. **アプリケーションの初期化**
   ```bash
   eb init
   ```

5. **環境の作成**
   ```bash
   eb create views-studio-production
   ```

6. **環境変数の設定**
   AWS Management Consoleから環境変数を設定

7. **デプロイ**
   ```bash
   eb deploy
   ```

### 手動サーバーセットアップ

#### Ubuntuサーバーの場合

1. **Node.jsのインストール**
   ```bash
   curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **MongoDBのインストール**
   ```bash
   sudo apt-get install -y mongodb
   sudo systemctl enable mongodb
   sudo systemctl start mongodb
   ```

3. **アプリケーションのクローン**
   ```bash
   git clone <リポジトリURL> /var/www/views-studio
   cd /var/www/views-studio
   ```

4. **依存関係のインストール**
   ```bash
   npm install --production
   ```

5. **環境変数の設定**
   ```bash
   nano .env
   # 必要な環境変数を設定
   ```

6. **PM2のインストールと設定**
   ```bash
   npm install -g pm2
   pm2 start app.js --name "views-studio"
   pm2 startup
   pm2 save
   ```

7. **Nginxのインストールと設定**
   ```bash
   sudo apt-get install -y nginx
   sudo nano /etc/nginx/sites-available/views-studio
   ```
   
   Nginx設定例:
   ```
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/views-studio /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **SSL証明書の設定（Let's Encrypt）**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 環境変数の設定

本番環境では、以下の環境変数を適切に設定することが重要です：

### 基本設定

```
NODE_ENV=production
PORT=3000
```

### データベース設定

```
MONGODB_URI=mongodb://username:password@host:port/database
```

### Cloudinary設定

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### セキュリティ設定

```
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

## セキュリティ対策

### HTTPS

すべての本番環境でHTTPSを有効にすることを強く推奨します。

1. **SSL証明書の取得**
   - Let's Encryptを使用して無料のSSL証明書を取得
   - または、商用SSL証明書を購入

2. **HTTPSリダイレクト**
   - すべてのHTTPリクエストをHTTPSにリダイレクト
   ```javascript
   // app.js
   if (process.env.NODE_ENV === 'production') {
     app.use((req, res, next) => {
       if (req.header('x-forwarded-proto') !== 'https') {
         res.redirect(`https://${req.header('host')}${req.url}`);
       } else {
         next();
       }
     });
   }
   ```

### セキュリティヘッダー

Helmet.jsを使用して、セキュリティヘッダーを設定：

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### CSRF対策

CSRF攻撃からの保護：

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// フォームを表示するルートでCSRFトークンを生成
app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// フォーム送信を処理するルートでCSRFトークンを検証
app.post('/process', csrfProtection, (req, res) => {
  // 処理...
});
```

### レート制限

DoS攻撃からの保護：

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100 // IPごとに15分間で100リクエストまで
});

app.use('/api/', apiLimiter);
```

## パフォーマンス最適化

### キャッシュ戦略

1. **静的ファイルのキャッシュ**
   ```javascript
   app.use(express.static('public', {
     maxAge: '1d' // 1日間キャッシュ
   }));
   ```

2. **データベースクエリのキャッシュ**
   - Redis等を使用してクエリ結果をキャッシュ

### 圧縮

応答データの圧縮：

```javascript
const compression = require('compression');
app.use(compression());
```

### クラスタリング

Node.jsのクラスタモジュールを使用して、マルチコアCPUを活用：

```javascript
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`マスタープロセス ${process.pid} 起動`);

  // ワーカーを起動
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`ワーカー ${worker.process.pid} 終了`);
    cluster.fork(); // 新しいワーカーを起動
  });
} else {
  // ワーカーはアプリケーションを実行
  require('./app.js');
}
```

## 監視とメンテナンス

### ロギング

1. **Winston等のロギングライブラリを使用**
   ```javascript
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     defaultMeta: { service: 'views-studio' },
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   
   if (process.env.NODE_ENV !== 'production') {
     logger.add(new winston.transports.Console({
       format: winston.format.simple()
     }));
   }
   ```

2. **ログローテーション**
   ```javascript
   const { createLogger, format, transports } = require('winston');
   require('winston-daily-rotate-file');
   
   const transport = new transports.DailyRotateFile({
     filename: 'logs/application-%DATE%.log',
     datePattern: 'YYYY-MM-DD',
     zippedArchive: true,
     maxSize: '20m',
     maxFiles: '14d'
   });
   ```

### モニタリング

1. **PM2の監視機能**
   ```bash
   pm2 monit
   ```

2. **外部モニタリングサービス**
   - New Relic
   - Datadog
   - Prometheus + Grafana

### バックアップ

1. **定期的なデータベースバックアップ**
   ```bash
   # crontabに追加
   0 2 * * * mongodump --uri="$MONGODB_URI" --out=/backups/mongodb/$(date +\%Y-\%m-\%d)
   ```

2. **バックアップの自動削除**
   ```bash
   # 30日以上経過したバックアップを削除
   find /backups/mongodb -type d -mtime +30 -exec rm -rf {} \;
   ```

### 更新とメンテナンス

1. **依存関係の更新**
   ```bash
   npm outdated # 古い依存関係の確認
   npm update   # 更新
   ```

2. **セキュリティ更新の適用**
   ```bash
   npm audit     # セキュリティ脆弱性のチェック
   npm audit fix # 修正可能な脆弱性を修正
   ```

## 次のステップ

デプロイメントの詳細については、以下のドキュメントを参照してください：

- [クラウドプラットフォーム別ガイド](./cloud-platforms.md)
- [スケーリング戦略](./scaling.md)
- [バックアップと復元](./backup-restore.md)
- [監視設定](./monitoring.md)
