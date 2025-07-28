/* index.js — メインルーター */

const express = require('express');
const router = express.Router();

// 各機能別ルーターのインポート
const workRoutes = require('./workRoutes');
const episodeRoutes = require('./episodeRoutes');
const shortClipRoutes = require('./shortClipRoutes');
const analyticsRoutes = require('./analyticsRoutes');


// 各ルーターをメインルーターに統合
router.use('/', workRoutes);
router.use('/', episodeRoutes);
router.use('/', shortClipRoutes);
router.use('/', analyticsRoutes);


// ホームページ
router.get('/', async (req, res) => {
  // ダッシュボードに表示するデータ
  const dashboardData = {
    totalWorks: 0,
    totalEpisodes: 0,
    monthlySales: 0,
    weeklyViews: 0,
    weeklyViewsChange: 0,
    engagementRate: 0,
    engagementRateChange: 0,
    recentWorks: [],
    monthlyChange: 0,
    yearlySales: 0,
    viewsData: [0, 0, 0, 0, 0, 0, 0],
    monthlySalesData: Array(12).fill(0)
  };
  
  res.render('partials/home', {
    layout: 'layout', 
    title: 'Views Studio', 
    pageStyle: 'home',
    ...dashboardData
  });
});

module.exports = router;
