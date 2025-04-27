/* ──────────  modules  ────────── */
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const stream     = require('stream');
const cloudinary = require('../config/cloudinary');

const Work       = require('../models/Work');
const Episode    = require('../models/Episode');

/* ────────── Multer (memory) ────────── */
const upload = multer({ storage: multer.memoryStorage() });

/* ────────── util: Cloudinary public_id 抽出 ────────── */
function extractPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(mp4|jpe?g|png|webm)/);
  return m ? m[1] : null;
}

/* ========== 作品（Work）ルート ========== */

/* 一覧 */
router.get('/contents', async (_req, res) => {
  const works = await Work.find().sort({ createdAt: -1 });
  res.render('partials/contents', {
    layout: 'layout',
    title: 'あなたの作品',
    pageStyle: 'contents',
    works
  });
});

/* 作成フォーム */
router.get('/works/new', (_req, res) =>
  res.render('partials/newWork', {
    layout: 'layout',
    title: '新しい作品を作成',
    pageStyle: 'newWork'
  })
);

/* 作成 POST */
router.post('/works', upload.single('thumbnail'), async (req, res) => {
  const { title, description, category, tags ,rating, releaseDate, cast, studio,} = req.body;

  /* サムネイルを Cloudinary へ */
  let thumbUrl = '';
  if (req.file) {
    const result = await new Promise((resolve, reject) => {
      const up = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'thumbnails' },
        (err, r) => (err ? reject(err) : resolve(r))
      );
      stream.Readable.from(req.file.buffer).pipe(up);
    });
    thumbUrl = result.secure_url;
  }

  const work = await new Work({
    title,
    description,
    category,
    thumbnailUrl: thumbUrl,
    rating,       
    releaseDate,  
    cast,     
    studio,   
    tags: tags ? tags.split(',').map(t => t.trim()) : []
    }).save();
    
     // 部門ごとにアップロード画面へ
     if (category === 'imageStory') {
        // 漫画ストーリー: 画像を複数アップしたい
         return res.redirect(`/works/${work._id}/episodes/image?created=1`);
       } else if (category === 'videoStory') {
         // 動画ストーリー
         return res.redirect(`/works/${work._id}/episodes/video?created=1`);
       } else if (category === 'singleVideo') {
         // 単発動画
         return res.redirect(`/works/${work._id}/upload?created=1`);
       } else {
         // 予備: 万が一何か別のカテゴリーが送られた時など
         return res.redirect(`/works/${work._id}?created=1`);
       }
});




/* 単発アップロードフォーム */
router.get('/works/:id/upload', async (req, res) => {
  const work = await Work.findById(req.params.id);
  res.render('partials/uploadSingle', {
    layout: 'layout',
    title : '作品アップロード',
    pageStyle: 'singleUpload',
    bodyClass: 'dark',
    work
  });
});

/* 単発アップロード POST */
router.post('/works/:id/upload', upload.single('contentFile'), async (req, res) => {
  const durationMin = req.body.duration;
  const contentType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

  const result = await new Promise((resolve, reject) => {
    const up = cloudinary.uploader.upload_stream(
      { resource_type: contentType, folder: 'singles' },
      (err, r) => (err ? reject(err) : resolve(r))
    );
    stream.Readable.from(req.file.buffer).pipe(up);
  });

  await Work.findByIdAndUpdate(req.params.id, {
    singleUrl  : result.secure_url,
    singleType : contentType,
    durationMin: parseInt(durationMin, 10)
  });

  res.redirect(`/works/${req.params.id}`);
});

/* ---------- 作品編集フォーム (split-view) ---------- */
router.get('/works/:id/edit', async (req, res) => {
  const work     = await Work.findById(req.params.id);
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });

  res.render('partials/workEdit', {      // ← 編集用 EJS
    layout    : 'layout',
    title     : '作品を編集',
    pageStyle : 'workDetail',            // 既存 CSS を使い回し
    pageScript: 'workDetail',            // 既存 JS を使い回し
    bodyClass : 'dark edit-mode',        // 画面を分割状態で表示
    work,
    episodes
  });
});


/* ---------- 作品更新 PUT ---------- */
router.put('/works/:id', upload.single('thumbnail'), async (req, res) => {
  const { title, description, category, tags } = req.body;

  /* サムネを再アップした場合だけ Cloudinary へ */
  let thumbUpdate = {};
  if (req.file) {
    const uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'thumbnails' },
        (err, r) => (err ? reject(err) : resolve(r))
      ).end(req.file.buffer);
    });
    thumbUpdate = { thumbnailUrl: uploaded.secure_url };
  }

  await Work.findByIdAndUpdate(req.params.id, {
    title,
    description,
    category,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    ...thumbUpdate
  });

  res.redirect('/contents');   // 保存後は一覧に戻る
});



/* 詳細ページ */
router.get('/works/:id', async (req, res) => {
  const work = await Work.findById(req.params.id);
  const created = (req.query.created === '1');
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });
  res.render('partials/workDetail', {
    layout: 'layout',
    title: work.title,
    work,
    episodes,
    bodyClass: 'dark',
    created
  });
});



/* 削除 DELETE */
router.delete('/works/:id', async (req, res) => {
  try {
    const workId   = req.params.id;
    const work     = await Work.findById(workId);
    const episodes = await Episode.find({ workId });

    /* ep ファイルを Cloudinary から削除 */
    for (const ep of episodes) {
      if (ep.cloudinaryUrl) {
        const pubId = extractPublicId(ep.cloudinaryUrl);
        await cloudinary.uploader.destroy(pubId, {
          resource_type: ep.contentType.startsWith('video') ? 'video' : 'image'
        });
      }
    }

    /* サムネイル削除 */
    if (work.thumbnailUrl) {
      const thumbId = extractPublicId(work.thumbnailUrl);
      await cloudinary.uploader.destroy(thumbId, { resource_type: 'image' });
    }

    /* DB 削除 */
    await Episode.deleteMany({ workId });
    await Work.findByIdAndDelete(workId);

    res.redirect('/contents');
  } catch (err) {
    console.error('作品削除エラー:', err);
    res.status(500).send('削除に失敗しました');
  }
});

/* ========== エピソードルート ========== */


/* ========== 漫画ストーリー (複数画像) ========== */

// アップロードフォーム GET
router.get('/works/:id/episodes/image', async (req, res) => {
  const work = await Work.findById(req.params.id);
  // 例: 新しいEJS `uploadEpisodeImages.ejs` を用意してください
  res.render('partials/uploadEpisodeImages', {
    layout: 'layout',
    title : '漫画エピソード追加',
    pageStyle: 'episodeUploadImages',
    bodyClass: 'dark',
    work
  });
});

// アップロード POST
router.post('/works/:id/episodes/image', upload.array('contentFiles'), async (req, res) => {
  try {
    // req.files は複数画像
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('画像が選択されていません');
    }

    // ここで Episode をどう作るかは要件次第
    //  1) すべてまとめて1つのEpisodeにする
    //  2) ファイル枚数分、複数Episodeを作る
    // など
    // ここでは例として1つのEpisodeにまとめる想定:
    const { title, description, isPaid, price } = req.body;
    // 画像のURL配列を生成
    const fileUrls = [];
    for (const file of req.files) {
      const contentType = file.mimetype.startsWith('video') ? 'video' : 'image'; 
      // 一応 "video" チェックも入れているが、想定外の場合に備える

      const result = await new Promise((resolve, reject) => {
        const up = cloudinary.uploader.upload_stream(
          { resource_type: contentType, folder: 'episodes' },
          (err, r) => (err ? reject(err) : resolve(r))
        );
        stream.Readable.from(file.buffer).pipe(up);
      });
      fileUrls.push(result.secure_url);
    }

    // 例：Episodeに images:[...] というフィールドを持たせる想定
    await new Episode({
      workId: req.params.id,
      title,
      description,
      contentType: 'image', // 漫画はimage扱い
      cloudinaryUrl: fileUrls[0], // 代表URL?
      images: fileUrls,          // 追加で images:[] みたいな配列フィールド
      isPaid: isPaid === 'true',
      price: isPaid === 'true' ? parseInt(price, 10) : 0
    }).save();

    return res.redirect(`/works/${req.params.id}`);
  } catch (err) {
    console.error('漫画エピソードアップエラー:', err);
    res.status(500).send('漫画エピソードアップロードに失敗しました');
  }
});

/* 動画ストーリーアップロードフォーム */
router.get('/works/:id/episodes/video', async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).send('作品が見つかりません');
    }

    res.render('partials/uploadEpisode', {
      layout: 'layout', 
      title: 'エピソードアップロード',
      pageStyle: 'episodeUpload',
      bodyClass: 'dark',
      work
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('サーバーエラーが発生しました');
  }
});



/* アップロード POST */
router.post('/works/:id/episodes', upload.single('contentFile'), async (req, res) => {
  const { title, episodeNumber, description, isPaid, price } = req.body;

  // ① episodeNumber が空なら「最後の +1」
  let epNum = parseInt(episodeNumber, 10);
  if (isNaN(epNum)) {
    const last = await Episode.findOne({ workId: req.params.id })
                              .sort({ episodeNumber: -1 })
                              .lean();
    epNum = last ? last.episodeNumber + 1 : 1;
  }

  // ② ファイル必須チェック
  if (!req.file) return res.status(400).send('ファイルが選択されていません');

  // ③ Cloudinary へアップロード
  const contentType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: contentType, folder: 'episodes' },
      (err, r) => (err ? reject(err) : resolve(r))
    ).end(req.file.buffer);
  });

  // ④ Episode 保存
  await new Episode({
    workId       : req.params.id,
    title,
    episodeNumber: epNum,
    description,
    contentType,
    cloudinaryUrl: result.secure_url,
    isPaid       : isPaid === 'true',
    price        : isPaid === 'true' ? parseInt(price, 10) : 0
  }).save();

  res.redirect(`/works/${req.params.id}`);
});


/* 編集フォーム */
router.get('/episodes/:id/edit', async (req, res) => {
  const episode = await Episode.findById(req.params.id);
  res.render('partials/episodeEdit', {
    layout: 'layout',
    title: 'エピソード編集',
    pageStyle: 'episodeEdit',
    bodyClass: 'dark',
    episode
  });
});

/* 編集 PUT */
router.put('/episodes/:id', async (req, res) => {
  const { title, description, episodeNumber, isPaid, price } = req.body;
  await Episode.findByIdAndUpdate(req.params.id, {
    title,
    description,
    episodeNumber,
    isPaid: isPaid === 'true',
    price: parseInt(price, 10)
  });
  const ep = await Episode.findById(req.params.id);
  res.redirect(`/works/${ep.workId}`);
});

/* 削除 DELETE */
router.delete('/episodes/:id', async (req, res) => {
  try {
    const ep = await Episode.findById(req.params.id);
    if (ep.cloudinaryUrl) {
      const pubId = extractPublicId(ep.cloudinaryUrl);
      await cloudinary.uploader.destroy(pubId, {
        resource_type: ep.contentType.startsWith('video') ? 'video' : 'image'
      });
    }
    await Episode.findByIdAndDelete(req.params.id);
    res.redirect(`/works/${ep.workId}`);
  } catch (err) {
    console.error('エピ削除失敗:', err);
    res.status(500).send('削除エラー');
  }
});

/* ========== ダッシュボード & ホーム ========== */

router.get('/admin', async (_req, res) => {
  const totalWorks    = await Work.countDocuments();
  const totalEpisodes = await Episode.countDocuments();
  const paidEpisodes  = await Episode.find({ isPaid: true });
  const totalRevenue  = paidEpisodes.reduce((s, ep) => s + (ep.price || 0), 0);

  res.render('partials/adminDashboard', {
    layout: 'layout',
    title: 'ダッシュボード',
    pageStyle: 'adminDashboard',
    stats: { totalWorks, totalEpisodes, totalRevenue }
  });
});

router.get('/home', async (_req, res) => {
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

module.exports = router;
