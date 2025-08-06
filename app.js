// MongoDB接続設定は .env の MONGO_URI を使用）
require('dotenv').config();
const express         = require('express');
const expressLayouts  = require('express-ejs-layouts');
const mongoose        = require('mongoose');
const path            = require('path');
const methodOverride  = require('method-override');

const Work    = require('./models/Work');
const Episode = require('./models/Episode');
// メインルーターをインポート（すべてのルートが統合されています）
const routes = require('./routes/index');

const app = express();

/* ---------- ミドルウェア ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));                 // ① body 先にパース
app.use(methodOverride('_method', { methods: ['POST', 'GET'] })); // ② _method=DELETE を変換

/* ---------- レイアウト ---------- */
app.use(expressLayouts);
app.set('layout', 'layout');

/* ---------- テンプレート / 静的 ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静的ファイルの提供設定
app.use(express.static(path.join(__dirname, 'public')));
app.use('/stylesheet', express.static(path.join(__dirname, 'stylesheet')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css'))); 

/* ---------- DB ---------- */
const MONGO_URI = process.env.MONGO_URI;

// DB接続処理を非同期で試行し、エラー時にも続行できるように修正
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 30000
})
  .then(() => {
    console.log('MongoDB 接続成功');
  })
  .catch(err => {
    console.error('MongoDB 接続失敗:', err);
    process.exit(1); // 接続できなければ起動しない
  });

/* ---------- ルート ---------- */
// すべてのルートを統合した index.js を使用
app.use('/', routes);

/* ---------- サーバ ---------- */
const port = process.env.PORT || 3001;  // 3000から3001に変更
app.listen(port, () => console.log(`Server started on port ${port}`));
