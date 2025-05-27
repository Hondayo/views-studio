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
  const shorts = await ShortClip.find().sort({ createdAt: -1 });
  res.render('partials/contents', {
    layout: 'layout',
    title: 'あなたのコンテンツ',
    pageStyle: 'contents',
    works,
    shorts
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
  const work = await Work.findById(req.params.id);
  if (!work) return res.status(404).send('作品が見つかりません');

  // workEdit.ejs を表示
  res.render('partials/workEdit', {
    layout: 'layout',  // レイアウトを使う場合
    title : '作品を編集',
    work
  });
}));

/** 作品更新 */
router.put('/works/:id', 
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'thumbnailVideo', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    // bodyから title / releaseDate / rating / cast / studio / tags などを取得
    const { title, releaseDate, rating, cast, studio, tags } = req.body;

    const update = { title, releaseDate, rating, cast, studio, tags: parseTags(tags) };

    // 新しいサムネイル画像アップロード
    if (req.files?.thumbnail?.[0]) {
      const thumbRes = await uploadToCloudinary(req.files.thumbnail[0], 'thumbnails');
      update.thumbnailUrl = thumbRes.secure_url;
    }

    // 新しいサムネイル動画アップロード
    if (req.files?.thumbnailVideo?.[0]) {
      const vidRes = await uploadToCloudinary(req.files.thumbnailVideo[0], 'thumbnails');
      update.thumbnailVideoUrl = vidRes.secure_url;
    }

    // DBを更新
    await Work.findByIdAndUpdate(req.params.id, update);

    // 完了後、作品詳細ページへリダイレクト
    res.redirect(`/works/${req.params.id}`);
  })
);


/** 作品ページ */
const ShortClip = require('../models/ShortClip');

// 分をhh:mm:ss形式に変換する関数
function formatMinutesToHMS(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '00:00:00';
  const h = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return [h, mm, 0].map(v => String(v).padStart(2, '0')).join(':');
}

// 最小限形式でdurationを返す
function formatDurationMinimized(duration) {
  if (!duration) return '0:00';
  let h = 0, m = 0, s = 0;
  if (typeof duration === 'number') duration = String(duration);
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else if (parts.length === 1) s = parts[0];

  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  else return `${m}:${String(s).padStart(2, '0')}`;
}

router.get('/works/:id', asyncHandler(async (req, res) => {
  const work     = await Work.findById(req.params.id);
  let episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });
  const shortClips = await ShortClip.find({ workId: work._id }).sort({ createdAt: -1 });

  // durationを最小限形式に変換
  episodes = episodes.map(ep => {
    let dur = ep.duration;
    if (typeof dur === 'number' && dur > 0) {
      dur = formatMinutesToHMS(dur);
    } else if (typeof dur === 'string' && dur.match(/^[0-9]+$/) && Number(dur) > 0) {
      dur = formatMinutesToHMS(Number(dur));
    } else if (typeof dur === 'string' && dur.length > 0 && dur.includes(':')) {
      // 既にhh:mm:ss形式
    } else {
      dur = '00:00:00';
    }
    dur = formatDurationMinimized(dur);
    return { ...ep.toObject(), duration: dur };
  });

  res.render('partials/workDetail', {
    layout: 'layout', title: work.title, bodyClass: 'dark',
    work, episodes, shortClips, created: req.query.created === '1'
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

  // 追加済みエピソードを取得して、テンプレートに表示してもOK
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });

  // ?created=1 が付いていればフラグを立てる
  const { created } = req.query;

  res.render('partials/uploadEpisode', {
    layout: 'layout',
    title: 'エピソードアップロード',
    pageStyle: 'episodeUpload',
    bodyClass: 'dark',
    work,
    episodes,
    created,
  });
}));


/** エピソード作成 */
router.post('/works/:id/episodes',
  upload.fields([
    { name: 'contentFile', maxCount: 1 },
    { name: 'thumbnailImage', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { title, episodeNumber, description, duration } = req.body;
    const price  = parseInt(req.body.price, 10) || 0;
    const isPaid = price > 0;

    // episodeNumber が空なら「最後の +1」とする
    const workId = req.params.id;
    let epNum = parseInt(episodeNumber, 10);
    if (Number.isNaN(epNum)) {
      const lastEp = await Episode.findOne({ workId }).sort({ episodeNumber: -1 }).lean();
      epNum = lastEp?.episodeNumber ? lastEp.episodeNumber + 1 : 1;
    }

    // 動画ファイル必須
    const videoFile = req.files?.contentFile?.[0];
    if (!videoFile) {
      return res.status(400).send('動画ファイルが選択されていません');
    }
    // サムネイル画像（任意）
    const thumbnailFile = req.files?.thumbnailImage?.[0];
    // Cloudinaryアップロード（動画）
    const { secure_url, resource_type } = await uploadToCloudinary(videoFile, 'episodes');
    // サムネイル画像もCloudinaryのepisodesthumbnailフォルダにアップロード
    const thumbRes = thumbnailFile ? await uploadToCloudinary(thumbnailFile, 'episodesthumbnail') : null;

    // DB 保存
    await new Episode({
      workId,
      title,
      episodeNumber: epNum,
      description,
      contentType: resource_type, // 'video' or 'image'
      cloudinaryUrl: secure_url,
      price,
      isPaid,
      duration: duration || '00:00:00',
      thumbnailUrl: thumbRes?.secure_url ?? ''
    }).save();

    // 追加後は同じ画面へ戻り、?created=1 で「追加成功」メッセージ表示
    res.redirect(`/works/${workId}/episodes/video?created=1`);
  })
);



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

// 作品検索API
router.get('/api/works', async (req, res) => {
  const q = req.query.q || '';
  const works = await Work.find({
    isDraft: false,
    title: { $regex: new RegExp(q, 'i') }
  });
  res.json(works);
});

// 指定作品のエピソード一覧
router.get('/api/works/:id/episodes', async (req, res) => {
  const episodes = await Episode.find({ workId: req.params.id });
  res.json(episodes);
});


// エピソード単体削除ルート
router.delete('/works/:workId/episodes/:epId', asyncHandler(async (req, res) => {
  const { workId, epId } = req.params;
  const episode = await Episode.findById(epId);
  if (!episode) return res.status(404).send('エピソードが見つかりません');

  // Cloudinary動画も削除
  if (episode.cloudinaryUrl) {
    const publicId = extractPublicId(episode.cloudinaryUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: episode.contentType && episode.contentType.startsWith('video') ? 'video' : 'image' });
      } catch (err) {
        console.error('Cloudinary削除エラー:', err);
      }
    }
  }
  // DBから削除
  await Episode.deleteOne({ _id: epId });
  // エピソード一覧ページへリダイレクト
  res.redirect(`/works/${workId}`);
}));

module.exports = router;