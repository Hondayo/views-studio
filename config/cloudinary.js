// =============================
//  依存パッケージ・環境変数の読込
// =============================
// dotenvを必ず先に読み込む
require('dotenv').config();
// デバッグ用に環境変数が読み込まれたか確認
console.log('✅ Loading Cloudinary config...');

const cloudinary = require('cloudinary').v2;

// =============================
//  Cloudinary 設定
// =============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// =============================
//  Cloudinaryインスタンスをエクスポート
// =============================
module.exports = cloudinary;
