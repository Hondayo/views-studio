const express = require('express');
const router = express.Router();
const Work = require('../models/Work');
const Episode = require('../models/Episode');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getStats = async () => {
  const totalWorks    = await Work.countDocuments();
  const totalEpisodes = await Episode.countDocuments();
  const revenueAgg    = await Episode.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  return { totalWorks, totalEpisodes, totalRevenue: revenueAgg[0]?.total ?? 0 };
};

router.get('/admin', asyncHandler(async (_req, res) => {
  const works  = await Work.find().lean();
  const eps    = await Episode.find().lean();
  const episodesByWork = eps.reduce((map, ep) => {
    (map[ep.workId] ||= []).push(ep);
    return map;
  }, {});

  const stats = await getStats();

  res.render('partials/adminDashboard', {
    layout: 'layout',
    title : 'ダッシュボード',
    pageStyle: 'adminDashboard',
    stats,
    works,
    episodesByWork
  });
}));

module.exports = router;
