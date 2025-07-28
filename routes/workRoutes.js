/* workRoutes.js — 作品関連のルーティング */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// モデルのインポート
const Work = require('../models/Work');
const Episode = require('../models/Episode');
const ShortClip = require('../models/ShortClip');

// ユーティリティのインポート
const { asyncHandler, upload, uploadToCloudinary, deleteCloudinaryResource, parseTags } = require('./utils/routeUtils');

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
    const { title, genre, description, tags, rating, releaseDate, cast, studio } = req.body;
    
    // 画像とビデオのアップロード
    const img = req.files?.thumbnail?.[0];
    const vid = req.files?.thumbnailVideo?.[0];
    
    // 画像アップロード
    let thumbnailUrl = '';
    if (img) {
      const result = await uploadToCloudinary(img, 'works');
      thumbnailUrl = result.secure_url;
    }
    
    // ビデオアップロード
    let thumbnailVideoUrl = '';
    if (vid) {
      const result = await uploadToCloudinary(vid, 'works');
      thumbnailVideoUrl = result.secure_url;
    }
    
    // 作品をDBに保存
    const work = await new Work({
      title,
      genre,
      description,
      tags: parseTags(tags),
      rating,
      releaseDate,
      cast,
      studio,
      thumbnailUrl,
      thumbnailVideoUrl,
    }).save();
    
    // 作成後は作品詳細ページへ移動
    res.redirect(`/works/${work._id}`);
  })
);

/** 作品更新 */
router.put('/works/:id', 
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'thumbnailVideo', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { title, genre, description, tags, rating, releaseDate, cast, studio } = req.body;
    const update = { title, genre, description, rating, releaseDate, cast, studio, tags: parseTags(tags) };
    
    // 現在の作品データを取得
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).send('作品が見つかりません');
    }
    
    // サムネイル画像のアップロードと更新
    const img = req.files?.thumbnail?.[0];
    if (img) {
      // 古いサムネイルがあれば削除
      if (work.thumbnailUrl) {
        await deleteCloudinaryResource(work.thumbnailUrl, 'image');
      }
      const result = await uploadToCloudinary(img, 'works');
      update.thumbnailUrl = result.secure_url;
    }
    
    // サムネイル動画のアップロードと更新
    const vid = req.files?.thumbnailVideo?.[0];
    if (vid) {
      // 古いサムネイル動画があれば削除
      if (work.thumbnailVideoUrl) {
        await deleteCloudinaryResource(work.thumbnailVideoUrl, 'video');
      }
      const result = await uploadToCloudinary(vid, 'works');
      update.thumbnailVideoUrl = result.secure_url;
    }
    
    await Work.findByIdAndUpdate(req.params.id, update);

    // 完了後、作品詳細ページへリダイレクト
    res.redirect(`/works/${req.params.id}`);
  })
);

// 時間フォーマット関数
const formatMinutesToHMS = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.round((minutes * 60) % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 最小限形式でdurationを返す
const formatDurationMinimized = (duration) => {
  if (!duration) return '00:00';
  
  const parts = duration.split(':').map(Number);
  let result = '';
  
  if (parts.length === 3) {
    // HH:MM:SS 形式
    if (parts[0] > 0) {
      result += `${parts[0]}:${parts[1].toString().padStart(2, '0')}`;
    } else {
      result += parts[1];
    }
    result += `:${parts[2].toString().padStart(2, '0')}`;
  }
  
  return result || duration;
};

/** 作品編集フォーム表示 */
router.get('/works/:id/edit', asyncHandler(async (req, res) => {
  const work = await Work.findById(req.params.id);
  if (!work) {
    return res.status(404).send('作品が見つかりません');
  }
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });

  // workEdit.ejs を表示
  res.render('partials/workEdit', {
    layout: 'layout',
    title: '作品を編集',
    pageStyle: 'workEdit',
    work,
    episodes
  });
}));

/** 作品詳細ページ */
router.get('/works/:id', asyncHandler(async (req, res) => {
  const work     = await Work.findById(req.params.id);
  let episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });
  
  // 総時間を計算
  let totalDuration = 0;
  episodes.forEach(ep => {
    if (ep.duration) {
      const parts = ep.duration.split(':');
      const hours = parseInt(parts[0]) || 0;
      const mins  = parseInt(parts[1]) || 0;
      const secs  = parseInt(parts[2]) || 0;
      totalDuration += hours * 60 + mins + secs / 60;
    }
  });
  
  // 関連するショートクリップを取得
  const shortClips = await ShortClip.find({ workId: work._id });

  // 日付をフォーマット
  work.formattedDate = work.createdAt.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  res.render('partials/workDetail', {
    layout: 'layout', title: work.title, bodyClass: 'dark',
    work, episodes, shortClips, created: req.query.created === '1'
  });
}));

/** 作品＋エピソード削除 */
router.delete('/works/:id', asyncHandler(async (req, res) => {
  const workId = req.params.id;
  const work   = await Work.findById(workId);
  if (!work) return res.status(404).send('作品が見つかりません');

  /* ---------- 1) 関連エピソードの取得 ---------- */
  const episodes = await Episode.find({ workId });
  
  /* ---------- 2) Cloudinaryからリソース削除 ---------- */
  if (work.thumbnailUrl) {
    await deleteCloudinaryResource(work.thumbnailUrl, 'image');
  }
  if (work.thumbnailVideoUrl) {
    await deleteCloudinaryResource(work.thumbnailVideoUrl, 'video');
  }
  const deletePromises = [];
  episodes.forEach(episode => {
    if (episode.cloudinaryUrl) {
      const resourceType = episode.contentType?.startsWith('video') ? 'video' : 'image';
      deletePromises.push(deleteCloudinaryResource(episode.cloudinaryUrl, resourceType));
    }
    if (episode.thumbnailUrl) {
      deletePromises.push(deleteCloudinaryResource(episode.thumbnailUrl, 'image'));
    }
  });
  await Promise.allSettled(deletePromises);

  /* ---------- 3) DB から削除 ---------- */
  await Episode.deleteMany({ workId });
  await Work.findByIdAndDelete(workId);

  res.redirect('/contents');
}));

/**
 * API: 有料作品一覧 / 検索
 * GET /api/works
 *   - ?q= ＜検索ワード＞
 */
router.get('/api/works', asyncHandler(async (req, res) => {
  const { q } = req.query;
  const matchStage = q ? { title: { $regex: q, $options: 'i' } } : {};

  const works = await Work.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'episodes',
        localField: '_id',
        foreignField: 'workId',
        as: 'episodes'
      }
    },
    {
      $addFields: {
        hasPaid: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: '$episodes',
                  as: 'ep',
                  cond: { $eq: ['$$ep.isPaid', true] }
                }
              }
            },
            0
          ]
        }
      }
    },
    { $match: { hasPaid: true } },
    {
      $project: {
        episodes: 0,
        updatedAt: 0,
        __v: 0
      }
    },
    { $sort: { createdAt: -1 } }
  ]);

  res.json(works);
}));

module.exports = router;
