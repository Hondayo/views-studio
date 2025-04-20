// app.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// ルートファイルを読み込み
const videoRoutes = require('./routes/videoRoutes');
const imageRoutes = require('./routes/imageRoutes'); // ← 新規: 画像用ルート

const app = express();

// JSONボディ等の設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1) MongoDB接続
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB接続成功'))
  .catch(err => console.error('MongoDB接続失敗:', err));

// 2) Cloudinary設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// 3) EJS, 静的ファイル
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// stylesheet/ にCSS/JSを置いている場合:
app.use(express.static(path.join(__dirname, 'stylesheet')));

// 4) 画面表示ルート (HTML/EJS のみ)
app.get('/', (req, res) => {
  res.render('home');  
});
app.get('/newImage', (req, res) => {
  res.render('newImage');
});
app.get('/newVideo', (req, res) => {
  res.render('newVideo');
});

// 5) ルートを適用
app.use('/', videoRoutes);  // 動画アップロード・編集・削除など
app.use('/', imageRoutes);  // 画像アップロードなど
 

// サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
