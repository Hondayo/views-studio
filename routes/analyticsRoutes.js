// analyticsRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// モデルのインポート
const Work = require('../models/Work');
const Episode = require('../models/Episode');
const Analytics = require('../models/Analytics');

// async/await用エラーハンドラ
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ダミーデータ生成関数（開発用）
const generateDummyData = (days = 30) => {
  const data = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // 視聴回数は直近が多く、徐々に減少する傾向に
    const viewFactor = Math.max(0.5, 1 - (i / days));
    const views = Math.floor(Math.random() * 100 * viewFactor) + 10;
    
    // 完了率は70-95%でランダム
    const completionRate = (Math.random() * 25 + 70) / 100;
    
    // 収益は視聴数 x 完了率 x 単価(5-15円)
    const unitPrice = Math.random() * 10 + 5;
    const revenue = Math.floor(views * completionRate * unitPrice);
    
    data.push({
      date: date.toISOString().split('T')[0],
      views,
      completions: Math.floor(views * completionRate),
      completionRate: completionRate.toFixed(2),
      revenue
    });
  }
  return data.reverse(); // 日付順に並べる
};

// リテンションデータ生成（ダミー）
const generateRetentionData = () => {
  const segments = 10; // 動画を10セグメントに分割
  const data = [];
  
  // 最初は100%で、徐々に減少
  for (let i = 0; i < segments; i++) {
    const segment = (i + 1) * 10; // 10%, 20%, ...
    // 早送りなど考慮して一部ランダム性を持たせる
    const retention = Math.max(20, 100 - i * (8 + Math.random() * 4));
    data.push({
      segment: `${segment}%`,
      retention
    });
  }
  
  return data;
};

// 作品全体の分析ページ
router.get('/works/:id/analyze', asyncHandler(async (req, res) => {
  const workId = req.params.id;
  
  // 作品データを取得
  const work = await Work.findById(workId);
  if (!work) return res.status(404).send('作品が見つかりません');
  
  // 関連エピソードを取得
  const episodes = await Episode.find({ workId }).sort({ episodeNumber: 1 });
  
  // 分析データ取得（現状はダミーデータを使用）
  const viewsData = generateDummyData(30);
  const retentionData = generateRetentionData();
  
  // リード獲得データ（ダミー）
  const leadsData = generateDummyData(30).map(item => ({
    ...item,
    views: Math.floor(item.views * 0.3), // 視聴の30%がリード
    completions: Math.floor(item.completions * 0.3),
  }));
  
  // 総視聴回数（ダミー）
  const totalViews = viewsData.reduce((sum, item) => sum + item.views, 0);
  const totalRevenue = viewsData.reduce((sum, item) => sum + item.revenue, 0);

  // マネタイズデータ（ダミー）
  const monetizationData = {
    totalRevenue: viewsData.reduce((sum, item) => sum + item.revenue, 0),
    conversionRate: 0.05, // 5%の人が購入
    episodeRevenue: episodes.map((ep, index) => ({
      id: ep._id,
      title: ep.title || `エピソード ${ep.episodeNumber}`,
      revenue: Math.floor(Math.random() * 5000) + 1000
    }))
  };
  work.totalViews = totalViews;
  work.totalRevenue = totalRevenue;
  
  // エピソードごとの視聴データ（ダミー）
  const episodesViewData = episodes.map(ep => ({
    id: ep._id,
    title: ep.title || `エピソード ${ep.episodeNumber}`,
    episodeNumber: ep.episodeNumber,
    views: Math.floor(Math.random() * 200) + 50,
    completionRate: Math.floor(Math.random() * 30) + 70,
    avgDuration: `${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
  }));
  
  res.render('partials/workAnalytics', {
    layout: 'layout',
    title: `${work.title} - 分析`,
    pageStyle: 'analytics',
    bodyClass: 'dark',
    
    work,
    episodes,
    episodesViewData: JSON.stringify(episodesViewData),
    viewsData: JSON.stringify(viewsData),
    retentionData: JSON.stringify(retentionData),
    leadsData: JSON.stringify(leadsData),
    monetizationData: JSON.stringify(monetizationData)
  });
}));

// エピソード個別の分析ページ
router.get('/works/:workId/episodes/:episodeId/analyze', asyncHandler(async (req, res) => {
  const { workId, episodeId } = req.params;
  
  // エピソードが存在するか確認
  const episode = await Episode.findById(episodeId);
  if (!episode) return res.status(404).send('エピソードが見つかりません');
  
  // 完全な表示用のルートにリダイレクト
  res.redirect(`/episode/${episodeId}`);
}));

// 分析API - 視聴データ取得
router.get('/api/analytics/:type/:id/views', asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { period = '30days' } = req.query;
  
  // 期間に応じたデータを生成（本実装ではDBから取得）
  const days = period === '7days' ? 7 : period === '90days' ? 90 : 30;
  const viewsData = generateDummyData(days);
  
  res.json(viewsData);
}));

// 分析API - リテンションデータ取得
router.get('/api/analytics/:type/:id/retention', asyncHandler(async (req, res) => {
  const retentionData = generateRetentionData();
  res.json(retentionData);
}));

// 分析API - マネタイズデータ取得
router.get('/api/analytics/:type/:id/monetization', asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { period = '30days' } = req.query;
  
  // 期間に応じたデータを生成（本実装ではDBから取得）
  const days = period === '7days' ? 7 : period === '90days' ? 90 : 30;
  const viewsData = generateDummyData(days);
  
  const monetizationData = {
    totalRevenue: viewsData.reduce((sum, item) => sum + item.revenue, 0),
    conversionRate: 0.05, // 5%の人が購入
    revenueByDay: viewsData.map(item => ({
      date: item.date,
      revenue: item.revenue
    }))
  };
  
  res.json(monetizationData);
}));

// メイン分析ページ（全体統計と作品一覧）
router.get('/analytics', asyncHandler(async (req, res) => {
  // 全作品を取得
  const works = await Work.find().sort({ createdAt: -1 });
  
  // 全体統計データ（ダミー）
  const totalViews = 45280;
  const totalRevenue = 128500;
  
  // 作品ごとの統計データ（ダミー）
  // Promise.allを使用してmapの非同期処理を適切に処理
  const workStatsPromises = works.map(async work => {
    // 各作品のエピソード数を非同期で取得
    const episodeCount = await Episode.countDocuments({ workId: work._id });
    
    return {
      _id: work._id,
      title: work.title,
      coverImage: work.thumbnailUrl, // 正しいフィールド名を使用
      views: Math.floor(Math.random() * 5000) + 1000,
      revenue: Math.floor(Math.random() * 20000) + 5000,
      episodeCount: episodeCount // 取得したエピソード数
    };
  });
  
  // すべてのPromiseが解決するのを待つ
  const workStats = await Promise.all(workStatsPromises);
  
  res.render('partials/analytics', {
    title: '分析 - Views Studio',
    totalViews,
    totalRevenue,
    works: workStats
  });
}));

// 作品分析ページ
router.get('/work/:id', asyncHandler(async (req, res) => {
  const workId = req.params.id;
  
  // DBから作品データを取得
  const work = await Work.findById(workId);
  if (!work) return res.status(404).send('作品が見つかりません');
  
  // 関連エピソードを取得
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });
  
  // 分析データ生成（現段階はサンプルでよい）
  const totalViews = Math.floor(Math.random() * 5000) + 1000;
  const totalRevenue = Math.floor(Math.random() * 50000) + 10000;
  
  // エピソードごとの統計データ（サンプル）
  const episodesData = episodes.map(ep => ({
    id: ep._id,
    title: ep.title || `第${ep.episodeNumber}話`,
    episodeNumber: ep.episodeNumber,
    views: Math.floor(Math.random() * 2000) + 500,
    revenue: Math.floor(Math.random() * 20000) + 5000,
    thumbnailUrl: ep.thumbnailUrl || null ,
    cloudinaryUrl: ep.cloudinaryUrl // サムネイルURLを追加
  }));
  
  res.render('partials/workAnalytics', {
    title: `${work.title} - 分析`,
    pageStyle: 'pages/workAnalytics',
    work: {
      _id: work._id,
      id: work._id,  // 互換性のため両方渡す
      title: work.title,
      publishDate: work.createdAt ? new Date(work.createdAt).toLocaleDateString('ja-JP') : '',
      thumbnailUrl: work.thumbnailUrl,
      totalViews: totalViews,
      totalRevenue: totalRevenue
    },
    episodes: episodesData,
    layout: 'layout'
  });
}));

// エピソード分析ページ（モック用）
router.get('/episode/:id', asyncHandler(async (req, res) => {
  const episodeId = req.params.id;
  
  // 実際のエピソードデータを取得
  const episode = await Episode.findById(episodeId);
  if (!episode) return res.status(404).send('エピソードが見つかりません');
  
  // 関連する作品を取得
  const work = await Work.findById(episode.workId);
  if (!work) return res.status(404).send('作品が見つかりません');
  
  // 同じ作品の他のエピソードも取得
  const allEpisodes = await Episode.find({ workId: episode.workId }).sort({ episodeNumber: 1 });
  
  // エピソードデータの加工
  const episodes = allEpisodes.map(ep => {
    // 各エピソードのダミー視聴データ
    const epViews = Math.floor(Math.random() * 2000) + 500;
    
    return {
      id: ep._id,
      title: ep.title || `第${ep.episodeNumber}話`,
      episodeNumber: ep.episodeNumber,
      views: epViews,
      thumbnailUrl: ep.thumbnailUrl || '/images/no-image.jpg'
    };
  });
  
  // 現在のエピソードの分析データ生成（サンプル）
  const views = Math.floor(Math.random() * 2000) + 500;
  const revenue = Math.floor(Math.random() * 20000) + 5000;
  
  // グラフ用データの生成（サンプル）
  const viewsData = generateDummyData(30);
  const retentionData = generateRetentionData();
  
  res.render('partials/episodeAnalytics', {
    title: `${episode.title || `第${episode.episodeNumber}話`} - 分析`,
    pageStyle: 'pages/episodeAnalytics',
    episode: {
      id: episode._id,
      title: episode.title || `第${episode.episodeNumber}話`,
      episodeNumber: episode.episodeNumber,
      workId: episode.workId,
      workTitle: work.title,
      thumbnailUrl: episode.thumbnailUrl || '/images/no-image.jpg',
      publishDate: episode.createdAt ? new Date(episode.createdAt).toLocaleDateString('ja-JP') : '',
      views: views,
      revenue: revenue,
      unitPrice: 350 // サンプル価格
    },
    episodes: episodes,
    viewsData: JSON.stringify(viewsData),
    retentionData: JSON.stringify(retentionData),
    layout: 'layout'
  });
}));

module.exports = router;
