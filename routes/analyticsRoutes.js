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
  
  // エピソードごとの視聴データ（ダミー）
  const episodesViewData = episodes.map(ep => ({
    id: ep._id,
    title: ep.title || `エピソード ${ep.episodeNumber}`,
    episodeNumber: ep.episodeNumber,
    views: Math.floor(Math.random() * 200) + 50,
    completionRate: Math.floor(Math.random() * 30) + 70,
    avgDuration: `${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
  }));
  
  res.render('analytics/workAnalytics', {
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
  
  // 作品とエピソードのデータを取得
  const work = await Work.findById(workId);
  const episode = await Episode.findById(episodeId);
  if (!work || !episode) return res.status(404).send('作品またはエピソードが見つかりません');
  
  // 同じ作品の他のエピソードも取得（サイドバー用）
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
  
  // マネタイズデータ（ダミー）
  const monetizationData = {
    totalRevenue: viewsData.reduce((sum, item) => sum + item.revenue, 0),
    conversionRate: 0.05, // 5%の人が購入
  };
  
  // デバイス別視聴データ（ダミー）
  const deviceData = [
    { device: 'モバイル', percentage: 55 },
    { device: 'タブレット', percentage: 15 },
    { device: 'デスクトップ', percentage: 30 }
  ];
  
  // ユーザー属性データ（ダミー）
  const userAttributesData = [
    { type: '新規ユーザー', percentage: 65 },
    { type: 'リピーター', percentage: 25 },
    { type: 'VIPユーザー', percentage: 10 }
  ];
  
  res.render('analytics/episodeAnalytics', {
    layout: 'layout',
    title: `${episode.title} - 分析`,
    pageStyle: 'analytics',
    bodyClass: 'dark',
    work,
    episode,
    episodes,
    viewsData: JSON.stringify(viewsData),
    retentionData: JSON.stringify(retentionData),
    leadsData: JSON.stringify(leadsData),
    monetizationData: JSON.stringify(monetizationData),
    deviceData: JSON.stringify(deviceData),
    userAttributesData: JSON.stringify(userAttributesData)
  });
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

// メイン分析ページ（サイドバーからのアクセス用）
router.get('/analytics', asyncHandler(async (req, res) => {
  // 最新の作品を取得してその分析ページにリダイレクト
  const latestWork = await Work.findOne().sort({ createdAt: -1 });
  
  if (latestWork) {
    res.redirect(`/works/${latestWork._id}/analyze`);
  } else {
    // 作品がない場合はコンテンツページにリダイレクト
    res.redirect('/contents');
  }
}));

module.exports = router;
