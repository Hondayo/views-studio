/* shortClipRoutes.js — ショートクリップ関連のルーティング */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// モデルのインポート
const Work = require('../models/Work');
const ShortClip = require('../models/ShortClip');

// ユーティリティのインポート
const { asyncHandler, upload, uploadToCloudinary, deleteCloudinaryResource } = require('./utils/routeUtils');

/* ========== ShortClip routes ========== */

/** ショートクリップ一覧 (両方のURLに対応) */
router.get(['/shortclips', '/shorts'], asyncHandler(async (req, res) => {
  // ショートクリップと関連作品・エピソード情報を取得
  const shortClips = await ShortClip.find()
    .populate('workId', 'title description') // 作品情報を関連付け
    .populate('episodeId', 'title description') // エピソード情報を関連付け
    .sort({ createdAt: -1 });
  const works = await Work.find({ isPaid: true }).sort({ createdAt: -1 });
  
  // contents.ejsをレンダリング
  // 注意: contents.ejsでは shorts という変数名で参照しているので、shorts として渡す
  res.render('partials/contents', {
    layout: 'layout',
    title: 'コンテンツ一覧',
    pageStyle: 'contents',
    shorts: shortClips, // shortClipsをshortsという名前で渡す
    works
  });
}));

/** 新規ショートクリップフォーム (両方のURLに対応) */
router.get(['/shortclips/new', '/shorts/new'], asyncHandler(async (req, res) => {
  // 関連付ける作品の選択肢を表示するため
  const works = await Work.find().sort({ title: 1 });
  
  res.render('partials/shortNew', {
    layout: 'layout',
    title: '新しいショートクリップを作成',
    pageStyle: 'newShortClip',
    works
  });
}));

/** ショートクリップ作成 (両方のURLに対応) */
router.post(['/shortclips', '/shorts'],
  upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { description, workId, workTitle, episodeId, episodeTitle, tags } = req.body;
    
    // ビデオファイルのアップロード（必須）
    const videoFile = req.files?.videoFile?.[0];
    if (!videoFile) {
      return res.status(400).send('ビデオファイルは必須です');
    }
    
    // Cloudinaryにアップロード
    const { secure_url } = await uploadToCloudinary(videoFile, 'shortclips');
    
    // サムネイルのアップロード（オプション）
    let thumbnailUrl = '';
    const thumbnailFile = req.files?.thumbnail?.[0];
    if (thumbnailFile) {
      const thumbResult = await uploadToCloudinary(thumbnailFile, 'shortclipsthumbnail');
      thumbnailUrl = thumbResult.secure_url;
    }
    
    // タグの処理（フロントエンドで分離済みのタグをカンマ区切りから配列へ）
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // ショートクリップをDBに保存
    // デバッグ用に値を確認
    console.log('ShortClip保存前の値確認:', {
      description,
      tags: tagArray,
      workId,
      workTitle,
      episodeId,
      episodeTitle,
      contentType: videoFile.mimetype,
      cloudinaryUrl: secure_url
    });
    
    await new ShortClip({
      description,
      workId: workId || null,
      workTitle: workTitle || '',
      episodeId: episodeId || null,
      episodeTitle: episodeTitle || '',
      tags: tagArray,
      cloudinaryUrl: secure_url,
      contentType: videoFile.mimetype,
      thumbnailUrl
    }).save();
    
    res.redirect('/shortclips?created=1');
  })
);

/** ショートクリップ詳細 (両方のURLに対応) */
router.get(['/shortclips/:id', '/shorts/:id'], asyncHandler(async (req, res) => {
  const shortClip = await ShortClip.findById(req.params.id);
  if (!shortClip) {
    return res.status(404).send('ショートクリップが見つかりません');
  }
  
  // 関連する作品があれば取得
  let work = null;
  if (shortClip.workId) {
    work = await Work.findById(shortClip.workId);
  }
  
  // 日付フォーマット
  shortClip.formattedDate = shortClip.createdAt.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  
  res.render('partials/shortClipDetail', {
    layout: 'layout',
    title: shortClip.title,
    pageStyle: 'shortClipDetail',
    bodyClass: 'dark',
    shortClip,
    work
  });
}));

/** ショートクリップ編集フォーム (両方のURLに対応) */
router.get(['/shortclips/:id/edit', '/shorts/:id/edit'], asyncHandler(async (req, res) => {
  const shortClip = await ShortClip.findById(req.params.id);
  if (!shortClip) {
    return res.status(404).send('ショートクリップが見つかりません');
  }
  
  // 関連付ける作品の選択肢を表示
  const works = await Work.find().sort({ title: 1 });
  
  res.render('partials/editShortClip', {
    layout: 'layout',
    title: 'ショートクリップを編集',
    pageStyle: 'editShortClip',
    shortClip,
    works
  });
}));

/** ショートクリップ更新 (両方のURLに対応) */
router.put(['/shortclips/:id', '/shorts/:id'],
  upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, workId, tags } = req.body;
    
    // 現在のショートクリップデータを取得
    const shortClip = await ShortClip.findById(id);
    if (!shortClip) {
      return res.status(404).send('ショートクリップが見つかりません');
    }
    
    // 更新データの準備
    const updateData = {
      title,
      description,
      workId: workId || null,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    // 新しいビデオファイルがあれば更新
    const videoFile = req.files?.videoFile?.[0];
    if (videoFile) {
      // 古いビデオがあれば削除
      if (shortClip.videoUrl) {
        await deleteCloudinaryResource(shortClip.videoUrl, 'video');
      }
      
      // 新しいビデオをアップロード
      const { secure_url } = await uploadToCloudinary(videoFile, 'shortclips');
      updateData.videoUrl = secure_url;
    }
    
    // 新しいサムネイルがあれば更新
    const thumbnailFile = req.files?.thumbnail?.[0];
    if (thumbnailFile) {
      // 古いサムネイルがあれば削除
      if (shortClip.thumbnailUrl) {
        await deleteCloudinaryResource(shortClip.thumbnailUrl, 'image');
      }
      
      // 新しいサムネイルをアップロード
      const thumbResult = await uploadToCloudinary(thumbnailFile, 'shortclipsthumbnail');
      updateData.thumbnailUrl = thumbResult.secure_url;
    }
    
    // DBの更新
    await ShortClip.findByIdAndUpdate(id, updateData);
    
    // 詳細ページへリダイレクト
    res.redirect(`/shortclips/${id}`);
  })
);

/** ショートクリップ削除 (両方のURLに対応) */
router.delete(['/shortclips/:id', '/shorts/:id'], asyncHandler(async (req, res) => {
  const shortClip = await ShortClip.findById(req.params.id);
  if (!shortClip) {
    return res.status(404).send('ショートクリップが見つかりません');
  }
  
  // Cloudinaryリソースを削除
  const deletePromises = [];
  
  // ビデオファイルの削除
  if (shortClip.videoUrl) {
    deletePromises.push(deleteCloudinaryResource(shortClip.videoUrl, 'video'));
  }
  
  // サムネイル画像の削除
  if (shortClip.thumbnailUrl) {
    deletePromises.push(deleteCloudinaryResource(shortClip.thumbnailUrl, 'image'));
  }
  
  // 削除処理の完了を待つ
  if (deletePromises.length > 0) {
    await Promise.allSettled(deletePromises);
  }
  
  // DBから削除
  await ShortClip.findByIdAndDelete(req.params.id);
  
  // 一覧ページへリダイレクト
  res.redirect('/shortclips');
}));

module.exports = router;
