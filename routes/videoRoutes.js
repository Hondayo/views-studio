// routes/videoRoutes.js
// ------------------------------------------------------------
//  動画アップロード〜 CRUD API & 一覧ページ表示ルート
// ------------------------------------------------------------
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const Video      = require('../models/Video');
const ImageModel = require('../models/Image');         // 画像も扱う場合

// ------------- Multer (memoryStorage) -----------------------
const upload = multer({ storage: multer.memoryStorage() });

/*
|--------------------------------------------------------------------------
| 1. GET /contents  ― 一覧ページ (EJS) を描画
|    ※ ここが無いと <%= videos %> が undefined になり TemplateError
|--------------------------------------------------------------------------
*/
router.get('/contents', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    const images = await ImageModel.find().sort({ createdAt: -1 });
    res.render('contents', { videos, images });        // <-- 必ず渡す
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

/*
|--------------------------------------------------------------------------
| 2. POST /api/uploadVideo  ― Cloudinary に動画をアップロード
|    フロント scriptVideo.js の FormData.append('video', file) に対応
|--------------------------------------------------------------------------
*/
router.post('/api/uploadVideo', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file found' });
    }

    const uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'video' },
        (err, result) => (err ? reject(err) : resolve(result))
      ).end(req.file.buffer);
    });

    // 仮タイトルで DB 保存（後から PATCH で上書き）
    const newVideo = await Video.create({
      title        : 'Untitled',
      cloudinaryUrl: uploaded.secure_url,
      publicId     : uploaded.public_id
    });

    res.json({
      success: true,
      message: 'アップロード成功',
      url    : uploaded.secure_url,
      videoId: newVideo._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'サーバーエラー' });
  }
});

/*
|--------------------------------------------------------------------------
| 3. POST /api/createVideoPost ― メタ情報保存
|--------------------------------------------------------------------------
*/
router.post('/api/createVideoPost', async (req, res) => {
  try {
    const { title, desc, tags, videoUrl } = req.body;

    const newVideo = await Video.create({
      title        : title || 'No Title',
      description  : desc  || '',
      tags         : (tags || '')
                      .split('#')
                      .map(t => t.trim())
                      .filter(Boolean),
      cloudinaryUrl: videoUrl || ''
    });

    res.json({ success: true, message: '投稿完了', video: newVideo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'サーバーエラー (createVideoPost)' });
  }
});

/*
|--------------------------------------------------------------------------
| 4. PATCH /api/video/:id ― タイトル・説明・タグを更新
|--------------------------------------------------------------------------
*/
router.patch('/api/video/:id', async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      {
        ...(title       && { title }),
        ...(description && { description }),
        ...(tags        && {
          tags: tags.split('#').map(t => t.trim()).filter(Boolean)
        })
      },
      { new: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    res.json({ success: true, message: 'Video updated', video: updatedVideo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'サーバーエラー' });
  }
});

/*
|--------------------------------------------------------------------------
| 5. DELETE /api/video/:id ― 動画削除（Cloudinary & MongoDB）
|--------------------------------------------------------------------------
*/
router.delete('/api/video/:id', async (req, res) => {
  try {
    const { publicId } = req.query;
    if (!publicId) {
      return res.status(400).json({ message: 'Missing publicId' });
    }

    // Cloudinary から削除
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'video' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    // MongoDB から削除
    const deletedVideo = await Video.findByIdAndDelete(req.params.id);
    if (!deletedVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});

module.exports = router;
