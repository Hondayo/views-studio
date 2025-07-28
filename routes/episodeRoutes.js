/* episodeRoutes.js — エピソード関連のルーティング */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// モデルのインポート
const Work = require('../models/Work');
const Episode = require('../models/Episode');

// ユーティリティのインポート
const { asyncHandler, upload, uploadToCloudinary, deleteCloudinaryResource } = require('./utils/routeUtils');

/* ========== Episode routes ========== */

/** アップロードフォーム */
router.get('/works/:id/episodes/video', asyncHandler(async (req, res) => {
  const work = await Work.findById(req.params.id);
  if (!work) return res.status(404).send('作品が見つかりません');

  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });
  const created = req.query.created === '1';

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
    const work = await Work.findById(workId);
    
    if (!work) {
      return res.status(404).send('作品が見つかりません');
    }
    
    let epNum = episodeNumber ? Number(episodeNumber) : null;
    
    if (!epNum) {
      // 最後のエピソード番号を取得して+1
      const lastEp = await Episode.findOne({ workId })
        .sort({ episodeNumber: -1 })
        .limit(1);
      epNum = lastEp ? Number(lastEp.episodeNumber) + 1 : 1;
    }
    
    // ファイルのアップロード
    const file = req.files?.contentFile?.[0];
    if (!file) {
      return res.status(400).send('ファイルがアップロードされていません');
    }
    
    // Cloudinaryにアップロード
    const { secure_url, resource_type } = await uploadToCloudinary(file, 'episodes');
    
    // サムネイルがあればアップロード
    let thumbRes = null;
    const thumbFile = req.files?.thumbnailImage?.[0];
    
    if (thumbFile) {
      thumbRes = await uploadToCloudinary(thumbFile, 'episodesthumbnail');
    }
    
    // エピソードをDBに保存
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

/** エピソード編集フォーム表示 */
router.get('/works/:workId/episodes/:epId/edit', asyncHandler(async (req, res) => {
  const { workId, epId } = req.params;
  
  // 作品の取得
  const work = await Work.findById(workId);
  if (!work) {
    return res.status(404).send('作品が見つかりません');
  }
  
  // 編集対象のエピソードを取得
  const episode = await Episode.findById(epId);
  if (!episode) {
    return res.status(404).send('エピソードが見つかりません');
  }

  // 関連エピソード一覧も取得（編集画面でも表示する場合）
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });
  
  // episodeEdit.ejs テンプレートをレンダリング
  res.render('partials/episodeEdit', {
    layout: 'layout',
    title: 'エピソード編集',
    pageStyle: 'episodeUpload', // エピソード編集もuploadと同じCSSを使用
    bodyClass: 'dark',
    work,
    episode,
    episodes
  });
}));

/** エピソード編集（更新） (PUT) */
router.put('/works/:workId/episodes/:epId/edit',
  upload.fields([
    { name: 'contentFile', maxCount: 1 },
    { name: 'thumbnailImage', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { workId, epId } = req.params;
    const { title, episodeNumber, description, price, duration } = req.body;
    const isPaid = parseInt(price, 10) > 0;
    
    // エピソードの存在確認
    const episode = await Episode.findById(epId);
    if (!episode) {
      return res.status(404).send('エピソードが見つかりません');
    }
    
    // 作品の存在確認
    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).send('作品が見つかりません');
    }
    
    // 更新データの準備
    const updateData = {
      title,
      episodeNumber: Number(episodeNumber),
      description,
      price: parseInt(price, 10) || 0,
      isPaid,
      duration: duration || '00:00:00'
    };
    
    // 新しい動画ファイルがあれば更新
    const videoFile = req.files?.contentFile?.[0];
    if (videoFile) {
      // 古い動画があれば削除
      if (episode.cloudinaryUrl) {
        console.log(`古い動画コンテンツを削除します: ${episode.cloudinaryUrl}`);
        const resourceType = episode.contentType?.startsWith('video') ? 'video' : 'image';
        
        const deleteResult = await deleteCloudinaryResource(episode.cloudinaryUrl, resourceType);
        if (deleteResult.success) {
          console.log(`エピソード(${episode._id})の古い動画コンテンツを正常に削除しました: ${deleteResult.publicId}`);
        } else {
          console.error(`エピソード(${episode._id})の古い動画コンテンツの削除に失敗: ${deleteResult.message}`);
          // 削除に失敗しても、アップロード自体は続行する
        }
      }
      
      // 新しい動画をアップロード
      const { secure_url, resource_type } = await uploadToCloudinary(videoFile, 'episodes');
      updateData.cloudinaryUrl = secure_url;
      updateData.contentType = resource_type;
    }
    
    // 新しいサムネイル画像があれば更新
    const thumbnailFile = req.files?.thumbnailImage?.[0];
    if (thumbnailFile) {
      // 古いサムネイルがあれば削除
      if (episode.thumbnailUrl) {
        console.log(`古いサムネイル画像を削除します: ${episode.thumbnailUrl}`);
        
        const deleteResult = await deleteCloudinaryResource(episode.thumbnailUrl, 'image');
        if (deleteResult.success) {
          console.log(`エピソード(${episode._id})の古いサムネイル画像を正常に削除しました: ${deleteResult.publicId}`);
        } else {
          console.error(`エピソード(${episode._id})の古いサムネイル画像の削除に失敗: ${deleteResult.message}`);
          // 削除に失敗しても、アップロード自体は続行する
        }
      }
      
      // 新しいサムネイルをアップロード
      const thumbRes = await uploadToCloudinary(thumbnailFile, 'episodesthumbnail');
      updateData.thumbnailUrl = thumbRes.secure_url;
    }
    
    // DBを更新
    await Episode.findByIdAndUpdate(epId, updateData);
    
    // 編集完了後、作品詳細ページへリダイレクト
    res.redirect(`/works/${workId}`);
  })
);

/** エピソード単体削除ルート */
router.delete('/works/:workId/episodes/:epId', asyncHandler(async (req, res) => {
  const { workId, epId } = req.params;
  const episode = await Episode.findById(epId);
  if (!episode) return res.status(404).send('エピソードが見つかりません');

  // 動画とサムネイル画像の両方を削除
  const deletePromises = [];
  
  // 1. 動画コンテンツの削除
  if (episode.cloudinaryUrl) {
    const resourceType = episode.contentType && episode.contentType.startsWith('video') ? 'video' : 'image';
    console.log(`エピソード削除: 動画コンテンツを削除します: ${episode.cloudinaryUrl}`);
    deletePromises.push(
      deleteCloudinaryResource(episode.cloudinaryUrl, resourceType)
      .then(result => {
        if (result.success) {
          console.log(`エピソード(${epId})の動画コンテンツを正常に削除しました`);
        } else {
          console.error(`エピソード(${epId})の動画コンテンツ削除に失敗: ${result.message}`);
        }
      })
    );
  }
  
  // 2. サムネイル画像の削除
  if (episode.thumbnailUrl) {
    console.log(`エピソード削除: サムネイル画像を削除します: ${episode.thumbnailUrl}`);
    deletePromises.push(
      deleteCloudinaryResource(episode.thumbnailUrl, 'image')
      .then(result => {
        if (result.success) {
          console.log(`エピソード(${epId})のサムネイル画像を正常に削除しました`);
        } else {
          console.error(`エピソード(${epId})のサムネイル画像削除に失敗: ${result.message}`);
        }
      })
    );
  }
  
  // 削除処理の完了を待つ（失敗しても続行）
  if (deletePromises.length > 0) {
    try {
      await Promise.allSettled(deletePromises);
      console.log(`エピソード(${epId})のCloudinaryリソース削除処理が完了しました`);
    } catch (error) {
      console.error(`エピソード(${epId})のCloudinaryリソース削除中にエラーが発生しました`, error);
    }
  }
  
  // DBから削除
  await Episode.deleteOne({ _id: epId });
  console.log(`エピソード(${epId})をデータベースから削除しました`);
  
  // エピソード一覧ページへリダイレクト
  res.redirect(`/works/${workId}`);
}));

/** エピソードAPIルーティング */
// 指定作品のエピソード一覧を取得するAPI
router.get('/api/works/:id/episodes', asyncHandler(async (req, res) => {
  try {
    const workId = req.params.id;
    const episodes = await Episode.find({ workId }).sort({ episodeNumber: 1 });
    res.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: error.message });
  }
}));

// 指定作品の特定エピソードを取得するAPI
router.get('/api/works/:id/episodes/:epId', asyncHandler(async (req, res) => {
  try {
    const { id, epId } = req.params;
    const episode = await Episode.findOne({ workId: id, _id: epId });
    
    if (!episode) {
      return res.status(404).json({ error: 'エピソードが見つかりません' });
    }
    
    res.json(episode);
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({ error: error.message });
  }
}));

module.exports = router;
