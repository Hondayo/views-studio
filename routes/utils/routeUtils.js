/* routeUtils.js — 共通ユーティリティ関数 */

// 読込順序ミスを吸収するため保険としてdotenvを追加
require('dotenv').config();
const multer = require('multer');
const stream = require('stream');
const cloudinary = require('../../config/cloudinary');

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

/** Cloudinaryリソースを削除する関数（リトライ機能付き） */
const deleteCloudinaryResource = async (url, resourceType, maxRetries = 2) => {
  if (!url) return { success: false, message: 'URLが空です' };
  
  const publicId = extractPublicId(url);
  if (!publicId) return { success: false, message: '無効なURL形式です' };
  
  let retries = 0;
  while (retries <= maxRetries) {
    try {
      console.log(`Cloudinaryリソース削除試行 (${retries+1}/${maxRetries+1}): ${publicId} (${resourceType})`);
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`Cloudinary削除結果: `, result);
      
      if (result && result.result === 'ok') {
        return { success: true, publicId, result };
      } else {
        console.warn(`Cloudinary削除に失敗: ${JSON.stringify(result)}`);
        retries++;
      }
    } catch (err) {
      console.error(`Cloudinary削除エラー (試行 ${retries+1}/${maxRetries+1}):`, err);
      retries++;
    }
    
    if (retries <= maxRetries) {
      // 失敗時は少し待機してリトライ
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return { success: false, message: `${maxRetries+1}回の試行後も削除できませんでした`, publicId };
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
const getStats = async (Episode, Work) => {
  const totalWorks    = await Work.countDocuments();
  const totalEpisodes = await Episode.countDocuments();
  const revenueAgg    = await Episode.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  return { totalWorks, totalEpisodes, totalRevenue: revenueAgg[0]?.total ?? 0 };
};

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

module.exports = {
  upload,
  asyncHandler,
  extractPublicId,
  deleteCloudinaryResource,
  uploadToCloudinary,
  parseTags,
  getStats,
  formatMinutesToHMS,
  formatDurationMinimized
};
