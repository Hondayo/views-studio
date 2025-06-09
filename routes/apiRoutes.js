const express = require('express');
const router = express.Router();
const Work = require('../models/Work');
const Episode = require('../models/Episode');

// 検索API
router.get('/api/works', async (req, res) => {
  const q = req.query.q || '';
  const works = await Work.find({
    isDraft: false,
    title: { $regex: new RegExp(q, 'i') }
  });
  res.json(works);
});

// 作品のエピソード一覧
router.get('/api/works/:id/episodes', async (req, res) => {
  try {
    const episodes = await Episode.find({ workId: req.params.id });
    res.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: error.message });
  }
});

// エピソード詳細取得
router.get('/api/works/:workId/episodes/:episodeId', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.episodeId);
    if (!episode) return res.status(404).json({ error: 'エピソードが見つかりません' });
    res.json({ episode });
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
