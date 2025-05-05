// routes/shortsRoutes.js

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const stream     = require('stream');
const cloudinary = require('../config/cloudinary');
const ShortClip  = require('../models/ShortClip');

const upload = multer({ storage: multer.memoryStorage() });

// ---- ヘルパー関数 ----
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const uploadToCloudinary = ({ buffer, mimetype }, folder) =>
  new Promise((resolve, reject) => {
    const resource_type = mimetype.startsWith('video') ? 'video' : 'image';
    const up = cloudinary.uploader.upload_stream(
      { resource_type, folder },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.Readable.from(buffer).pipe(up);
  });

const parseTags = tags => (tags ? tags.split(',').map(t => t.trim()) : []);

// ---- ルート定義 ----

/** ショート動画一覧 GET /shorts */
router.get('/', asyncHandler(async (req, res) => {
  const shorts = await ShortClip.find().sort({ createdAt: -1 });
  // テンプレートがなければ JSONでもOK
  res.render('partials/shortList', {
    layout: 'layout',
    title: 'ショート動画一覧',
    shorts
  });
}));

/** 新規投稿フォーム GET /shorts/new */
router.get('/new', (req, res) => {
  res.render('partials/shortNew', {
    layout: 'layout',
    title: 'ショート動画投稿',
    pageStyle: 'shortNew'
  });
});

/** 作成処理 POST /shorts */
router.post('/', 
  upload.single('shortVideo'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).send('ショート動画ファイルがありません');
    }

    const { title, description, tags, visibility, duration } = req.body;

    // Cloudinary へアップロード
    const folder = 'shorts';
    const { secure_url, resource_type } = await uploadToCloudinary(req.file, folder);

    // DB 保存
    const newShort = await new ShortClip({
      title,
      description,
      tags         : parseTags(tags),
      visibility   : visibility || 'public',
      cloudinaryUrl: secure_url,
      contentType  : resource_type, // 'video'
      duration     : parseInt(duration, 10) || 0
    }).save();

    // 投稿後、詳細ページへリダイレクト
    res.redirect(`/shorts/${newShort._id}`);
  })
);

/** 詳細ページ GET /shorts/:id */
router.get('/:id', asyncHandler(async (req, res) => {
  const short = await ShortClip.findById(req.params.id);
  if (!short) return res.status(404).send('ショート動画が見つかりません');

  res.render('partials/shortDetail', {
    layout: 'layout',
    title : short.title,
    short,
  });
}));

module.exports = router;
