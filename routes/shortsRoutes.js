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

// 説明欄から説明文と#タグを分離する
function parseDescriptionAndTags(raw) {
  // 例: "これは説明 #猫 #犬"
  const tagMatches = raw.match(/#([^\s#]+)/g) || [];
  const tags = tagMatches.map(t => t.slice(1));
  // #タグ部分を除いた説明文
  const description = raw.replace(/#([^\s#]+)/g, '').trim();
  return { description, tags };
}

// ---- ルート定義 ----

/** ショート動画一覧 GET /shorts */

/** 新規投稿フォーム GET /shorts/new */
router.get('/new', (req, res) => {
  res.render('partials/shortNew', {
    layout: 'layout',
    title: 'ショート動画投稿',
    pageStyle: 'shortNew'
  });
});

/** 作成処理 POST /shorts */
router.post('/', upload.single('shortVideo'), asyncHandler(async (req, res) => {
  // JSON API経由の場合（Cloudinaryアップロード済みURLが送られてくる）
  if (req.is('application/json')) {
    const { description: rawDescription, tags, workId, episodeId, videoUrl, duration } = req.body;
    if (!videoUrl) return res.status(400).json({ error: '動画URLがありません' });
    const { description, tags: parsedTags } = parseDescriptionAndTags(rawDescription || '');
    const newShort = await new ShortClip({
      title: '作品投稿', // 必要に応じて作品タイトル取得
      description,
      tags: parsedTags.length ? parsedTags : parseTags(tags),
      visibility: 'public',
      cloudinaryUrl: videoUrl,
      contentType: 'video',
      duration: parseInt(duration, 10) || 0,
      workId,
      episodeId
    }).save();
    return res.json({ _id: newShort._id });
  }
  // フォーム送信（従来通り）
  if (!req.file) {
    return res.status(400).send('ショート動画ファイルがありません');
  }
  // 受け取ったフォームデータをログ出力
  const { title, description: rawDescription, tags, visibility, duration, episodeTitle } = req.body;
  // 説明欄から説明文と#タグを抽出
  const { description, tags: parsedTags } = parseDescriptionAndTags(rawDescription || '');
  const folder = 'shorts';
  const { secure_url, public_id, resource_type } = await uploadToCloudinary(req.file, folder);
  const newShort = await new ShortClip({
    title,
    description,
    tags: parsedTags.length ? parsedTags : parseTags(tags),
    visibility: visibility || 'public',
    cloudinaryUrl: secure_url,
    cloudinaryPublicId: public_id,
    contentType: resource_type, // 'video'
    duration: parseInt(duration, 10) || 0,
    episodeTitle // 追加: エピソード名
  }).save();
  // 投稿後、一覧ページへリダイレクト
  if (req.is('application/json')) {
    return res.json({ redirect: '/contents' });
  }
  res.redirect('/contents');
}));

/** ショート動画削除 DELETE /shorts/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  const short = await ShortClip.findById(req.params.id);
  if (!short) return res.status(404).send('ショート動画が見つかりません');
  // Cloudinaryから動画削除
  if (short.cloudinaryPublicId) {
    try {
      const result = await cloudinary.uploader.destroy(short.cloudinaryPublicId, { resource_type: 'video' });
    } catch (err) {
      console.error('Cloudinary削除エラー:', err);
    }
  }
  // DBから削除
  await ShortClip.deleteOne({ _id: req.params.id });
  res.redirect('/contents');
}));

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
