// =============================
//  環境変数・依存パッケージ読込
// =============================
require('dotenv').config();
const express         = require('express');
const expressLayouts  = require('express-ejs-layouts');
const mongoose        = require('mongoose');
const path            = require('path');
const methodOverride  = require('method-override');

// =============================
//  モデル・ルート読込
// =============================
const Work           = require('./models/Work');
const Episode        = require('./models/Episode');
const contentsRoutes = require('./routes/contentsRoutes');
const shortsRoutes   = require('./routes/shortsRoutes');
const analyticsRoutes= require('./routes/analyticsRoutes');

// =============================
//  Expressアプリ生成
// =============================
const app = express();

// =============================
//  ミドルウェア設定
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // リクエストbodyのパース
app.use(methodOverride('_method', { methods: ['POST', 'GET'] })); // method-overrideで疑似PUT/DELETE対応

// =============================
//  レイアウト・テンプレート・静的ファイル
// =============================
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'stylesheet'))); // カスタムCSS
app.use(express.static(path.join(__dirname, 'public')));    // 画像など

// =============================
//  DB接続
// =============================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB 接続成功'))
  .catch(err  => console.error('MongoDB 接続失敗:', err));

// =============================
//  ルーティング
// =============================

// --- ログインページ ---
app.get('/login', (req, res) => {
  res.render('partials/login', { title: 'ログイン' });
});

// --- メインのコンテンツルート ---
app.use('/', contentsRoutes);
// --- ショート動画ルート ---
app.use('/shorts', shortsRoutes);
// --- アナリティクスルート ---
app.use('/', analyticsRoutes);

// --- ホーム（トップページ） ---
app.get('/', async (req, res) => {
  // サマリー情報を集計
  const totalWorks    = await Work.countDocuments();
  const totalEpisodes = await Episode.countDocuments();
  const paidEpisodes  = await Episode.find({ isPaid: true });
  const totalRevenue  = paidEpisodes.reduce((s, ep) => s + (ep.price || 0), 0);

  res.render('partials/home', {
    layout: 'layout',
    title: 'ホーム',
    pageStyle: 'home',
    stats: { totalWorks, totalEpisodes, totalRevenue }
  });
});

// =============================
//  サーバ起動
// =============================
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));
