
/* index.js — メインルーター */
const express = require('express');
const router  = express.Router();

const workRoutes      = require('./workRoutes');
const episodeRoutes   = require('./episodeRoutes');
const shortClipRoutes = require('./shortClipRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const Work    = require('../models/Work');
const Episode = require('../models/Episode');


/* サブルーター統合 */
router.use('/', workRoutes);
router.use('/', episodeRoutes);
router.use('/', shortClipRoutes);
router.use('/', analyticsRoutes);

/* ホームダッシュボード */
router.get('/', async (req, res, next) => {
  try {
    // 作品と各作品のエピソード数を取得
    const works = await Work.find().lean();
    
    // 各作品にエピソード数を追加
    const worksWithEpisodeCounts = await Promise.all(
      works.map(async (work) => {
        const episodeCount = await Episode.countDocuments({ workId: work._id });
        return {
          ...work,
          episodeCount
        };
      })
    );

    // 総売上計算（仮の計算式）
    const totalRevenue = worksWithEpisodeCounts.reduce((sum, work) => {
      return sum + (work.revenue || 0);
    }, 0);

    const dashboardData = {
      totalWorks   : works.length,
      totalEpisodes: await Episode.countDocuments(),
      totalRevenue,
      works: worksWithEpisodeCounts,   // エピソード数付きの作品データ

      weeklyViewsChange    : 0,
      engagementRate       : 0,
      engagementRateChange : 0,
      monthlyChange   : 0,
      yearlySales     : 0,
      viewsData       : Array(7).fill(0),
      monthlySalesData: Array(12).fill(0)
    };

    res.render('partials/home', {
      layout   : 'layout',
      title    : 'Views Studio',
      pageStyle: 'home',
      ...dashboardData
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;