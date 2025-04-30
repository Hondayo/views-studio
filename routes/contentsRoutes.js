/* contentsRoutes.js — refactor without changing behaviour */

/* ────────── modules ────────── */
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const stream     = require('stream');
const cloudinary = require('../config/cloudinary');

const Work    = require('../models/Work');
const Episode = require('../models/Episode');

/* ────────── multer (memory) ────────── */
const upload = multer({ storage: multer.memoryStorage() });

/* ────────── helpers ────────── */
/** async/await 用の共通エラーハンドラ */
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Cloudinary の public_id を URL から抽出 */
const extractPublicId = url => {
  const m = url?.match(/\/upload\/(?:v\d+\/)?(.+?)\.(mp4|jpe?g|png|webm)/);
  return m ? m[1] : null;
};

/** Cloudinary へストリームアップロード */
const uploadToCloudinary = ({ buffer, mimetype }, folder) =>
  new Promise((resolve, reject) => {
    const resource_type = mimetype.startsWith('video') ? 'video' : 'image';
    const up = cloudinary.uploader.upload_stream(
      { resource_type, folder },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.Readable.from(buffer).pipe(up);
  });

/** カンマ区切りタグを配列化 */
const parseTags = tags => (tags ? tags.split(',').map(t => t.trim()) : []);

/** 売上等ダッシュボード統計 */
const getStats = async () => {
  const totalWorks    = await Work.countDocuments();
  const totalEpisodes = await Episode.countDocuments();
  const revenueAgg    = await Episode.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  return { totalWorks, totalEpisodes, totalRevenue: revenueAgg[0]?.total ?? 0 };
};

/* ========== Work routes ========== */

/** 作品一覧 */
router.get('/contents', asyncHandler(async (_req, res) => {
  const works = await Work.find().sort({ createdAt: -1 });
  res.render('partials/contents', {
    layout: 'layout', title: 'あなたの作品', pageStyle: 'contents', works
  });
}));

/** 新規作成フォーム */
router.get('/works/new', (_req, res) =>
  res.render('partials/newWork', {
    layout: 'layout', title: '新しい作品を作成', pageStyle: 'newWork'
  })
);

/** 作品作成 */
router.post('/works',
  upload.fields([
    { name: 'thumbnail',      maxCount: 1 },
    { name: 'thumbnailVideo', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { title, description, category, tags, rating, releaseDate, cast, studio } = req.body;

    const thumbRes      = req.files?.thumbnail?.[0]      ? await uploadToCloudinary(req.files.thumbnail[0], 'thumbnails') : null;
    const thumbVideoRes = req.files?.thumbnailVideo?.[0] ? await uploadToCloudinary(req.files.thumbnailVideo[0], 'thumbnails') : null;

    const work = await new Work({
      title, description, category, rating, releaseDate, cast, studio,
      thumbnailUrl     : thumbRes?.secure_url     ?? '',
      thumbnailVideoUrl: thumbVideoRes?.secure_url ?? '',
      tags: parseTags(tags)
    }).save();

    res.redirect(`/works/${work._id}/episodes/video?created=1`);
  })
);

/** 作品編集フォーム */
router.get('/works/:id/edit', asyncHandler(async (req, res) => {
  const work     = await Work.findById(req.params.id);
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });

  res.render('partials/workEdit', {
    layout: 'layout', title: '作品を編集', pageStyle: 'workDetail', pageScript: 'workDetail',
    bodyClass: 'dark edit-mode', work, episodes
  });
}));

/** 作品更新 */
router.put('/works/:id', upload.single('thumbnail'), asyncHandler(async (req, res) => {
  const { title, description, category, tags } = req.body;
  const update = { title, description, category, tags: parseTags(tags) };

  if (req.file) {
    const { secure_url } = await uploadToCloudinary(req.file, 'thumbnails');
    update.thumbnailUrl = secure_url;
  }

  await Work.findByIdAndUpdate(req.params.id, update);
  res.redirect('/contents');
}));

/** 作品ページ */
router.get('/works/:id', asyncHandler(async (req, res) => {
  const work     = await Work.findById(req.params.id);
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });

  res.render('partials/workDetail', {
    layout: 'layout', title: work.title, bodyClass: 'dark',
    work, episodes, created: req.query.created === '1'
  });
}));

/** 作品削除 */
/** 作品＋エピソード削除 */
router.delete('/works/:id', asyncHandler(async (req, res) => {
  const workId = req.params.id;
  const work   = await Work.findById(workId);
  if (!work) return res.status(404).send('作品が見つかりません');

  /* ---------- 1) サムネ画像 / サムネ動画 ---------- */
  const thumbTargets = [
    { url: work.thumbnailUrl,      type: 'image' },
    { url: work.thumbnailVideoUrl, type: 'video' }
  ];
  await Promise.all(
    thumbTargets
      .filter(t => t.url)
      .map(({ url, type }) =>
        cloudinary.uploader.destroy(extractPublicId(url), { resource_type: type })
      )
  );

  /* ---------- 2) エピソード本体 & Cloudinary ---------- */
  const episodes = await Episode.find({ workId });
  await Promise.all(
    episodes.map(ep =>
      cloudinary.uploader.destroy(
        extractPublicId(ep.cloudinaryUrl),
        { resource_type: ep.contentType.startsWith('video') ? 'video' : 'image' }
      )
    )
  );

  /* ---------- 3) DB から削除 ---------- */
  await Episode.deleteMany({ workId });
  await Work.findByIdAndDelete(workId);

  res.redirect('/contents');
}));

/* ========== Episode routes ========== */

/** アップロードフォーム */
router.get('/works/:id/episodes/video', asyncHandler(async (req, res) => {
  const work = await Work.findById(req.params.id);
  if (!work) return res.status(404).send('作品が見つかりません');

  res.render('partials/uploadEpisode', {
    layout: 'layout', title: 'エピソードアップロード', pageStyle: 'episodeUpload', bodyClass: 'dark', work
  });
}));

/** エピソード作成 */
router.post('/works/:id/episodes', upload.single('contentFile'), asyncHandler(async (req, res) => {
  const { title, episodeNumber, description, duration } = req.body;
  const price  = parseInt(req.body.price, 10) || 0;
  const isPaid = price > 0;

  // episodeNumber が空なら "最後の +1"
  const givenNum = parseInt(episodeNumber, 10);
  const epNum = Number.isNaN(givenNum)
    ? (await Episode.findOne({ workId: req.params.id }).sort({ episodeNumber: -1 }).lean())?.episodeNumber + 1 || 1
    : givenNum;

  if (!req.file) return res.status(400).send('ファイルが選択されていません');

  const { secure_url, resource_type } = await uploadToCloudinary(req.file, 'episodes');

  await new Episode({
    workId: req.params.id, title, episodeNumber: epNum, description,
    contentType: resource_type, cloudinaryUrl: secure_url,
    price, isPaid, duration: parseInt(duration, 10) || 0
  }).save();

  res.redirect(`/works/${req.params.id}`);
}));


/* ========== Dashboard & Home ========== */

// routes/contentsRoutes.js など
router.get('/admin', async (_req, res) => {
  // ① 作品とエピソード
  const works  = await Work.find().lean();
  const eps    = await Episode.find().lean();
  const episodesByWork = eps.reduce((map, ep) => {
    (map[ep.workId] ||= []).push(ep);
    return map;
  }, {});

  // ③ 既存サマリー
  const stats = {
    totalWorks    : works.length,
    totalEpisodes : eps.length,
    totalRevenue  : eps.filter(e => e.isPaid).reduce((s,e)=>s+e.price,0)
  };

  res.render('partials/adminDashboard', {
    layout: 'layout',
    title : 'ダッシュボード',
    pageStyle: 'adminDashboard',
    stats,
    works,
    episodesByWork
  });
});

module.exports = router; 