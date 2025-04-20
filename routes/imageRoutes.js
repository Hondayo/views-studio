// routes/imageRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;


const upload = multer({ storage: multer.memoryStorage() });

/* (A) 複数画像アップロード: POST /api/uploadImage */
router.post('/api/uploadImage', upload.array('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files found' });
    }

    // Cloudinaryに並列アップロード
    const promises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }
        ).end(file.buffer);
      });
    });

    const urls = await Promise.all(promises);

    return res.json({
      success: true,
      urls,
      message: '複数画像アップロード成功'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'サーバーエラー(画像)' });
  }
});

/* (B) 投稿ボタン押下: /api/createImagePost */
router.post('/api/createImagePost', async (req, res) => {
  try {
    const { title, desc, tags, images } = req.body;
    // ここでDBに保存するなら
    // e.g. const newImages = await SomeImageModel.create({ ... });
    return res.json({
      success: true,
      message: '画像投稿完了',
      // items: newImages,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'サーバーエラー (createImagePost)' });
  }
});



// imageRoutes.js
router.delete('/api/image/:id', async (req, res) => {
    try {
      const imageId = req.params.id;
      const publicId = req.query.publicId;
      if (!publicId) {
        return res.status(400).json({ success: false, message: 'Missing publicId' });
      }
  
      // 1) Cloudinaryから削除 (resource_type: 'image')
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
  
      // 2) DBから削除 (例: ImageModel or Episode?)
      const deletedImage = await ImageModel.findByIdAndDelete(imageId);
      if (!deletedImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
      }
  
      return res.json({ success: true, message: 'Image deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error', error: err });
    }
  });
  

module.exports = router;
