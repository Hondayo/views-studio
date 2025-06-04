// =============================
//  依存パッケージ・環境変数の読込
// =============================
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// =============================
//  Cloudinary 設定
// =============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// =============================
//  Cloudinaryインスタンスをエクスポート
// =============================
module.exports = cloudinary;
