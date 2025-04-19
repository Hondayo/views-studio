require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

const app = express();

// JSONボディを解釈
app.use(express.json());

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

// 4) Multer設定
const upload = multer({ storage: multer.memoryStorage() });

// 5) モデルを読み込み
const Video = require('./models/Video');

// 6) 画面表示ルート
app.get('/', (req, res) => {
  res.render('new');  // new.ejs
});

// 7) 動画アップロード & DB保存
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file found' });
    }
    // Cloudinaryへアップロード
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'video' },
        (err, uploaded) => {
          if (err) reject(err);
          else resolve(uploaded);
        }
      ).end(req.file.buffer);
    });

    // DB登録
    const newVideo = await Video.create({
      title: 'Untitled',
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id
    });

    return res.json({
      success: true,
      url: result.secure_url,
      videoId: newVideo._id,
      message: 'アップロード成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'サーバーエラー' });
  }
});

// 8) PATCHルート: タイトル/説明/タグを保存
app.patch('/api/video/:id', async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    // (A) #で区切る例:
    // 例: "#ワンピース #面白い" → ["ワンピース","面白い"]
    let tagsArr = [];
    if (tags) {
      tagsArr = tags.split('#')       // '#' で区切る
                    .map(t => t.trim())  // 前後空白除去
                    .filter(Boolean);    // 空要素除去
    }

    // (B) DB更新
    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        tags: tagsArr
      },
      { new: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

   // 新ルート: /contents
app.get('/contents', async (req, res) => {
    try {
      // DBからすべての動画を取得、作成日の新しい順に
      const videos = await Video.find().sort({ createdAt: -1 });
      // contents.ejs へ渡す
      res.render('contents', { videos });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });


    return res.json({
      success: true,
      message: 'Video updated',
      video: updatedVideo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'サーバーエラー' });
  }
});

// app.js (抜粋)
app.delete('/api/video/:id', async (req, res) => {
    try {
      const videoId = req.params.id;
      const publicId = req.query.publicId; // クエリパラメータから取得
  
      // 1) Cloudinary から削除
      if (!publicId) {
        return res.status(400).json({ message: 'Missing publicId' });
      }
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type: 'video' }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
  
      // 2) DBから削除
      const deletedVideo = await Video.findByIdAndDelete(videoId);
      if (!deletedVideo) {
        return res.status(404).json({ message: 'Video not found' });
      }
  
      return res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err });
    }
  });
  

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
