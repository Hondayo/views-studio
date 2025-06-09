require('dotenv').config();
const express         = require('express');
const expressLayouts  = require('express-ejs-layouts');
const mongoose        = require('mongoose');
const path            = require('path');
const methodOverride  = require('method-override');

const Work    = require('./models/Work');
const Episode = require('./models/Episode');
const worksRoutes    = require('./routes/worksRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const apiRoutes      = require('./routes/apiRoutes');
const shortsRoutes = require('./routes/shortsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

/* ---------- ミドルウェア ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));                 // ① body 先にパース
app.use(methodOverride('_method', { methods: ['POST', 'GET'] })); // ② _method=DELETE を変換

/* ---------- レイアウト ---------- */
app.use(expressLayouts);
app.set('layout', 'layout');

/* ---------- テンプレート / 静的 ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'stylesheet')));
app.use(express.static(path.join(__dirname, 'public'))); 

/* ---------- DB ---------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB 接続成功'))
  .catch(err  => console.error('MongoDB 接続失敗:', err));

/* ---------- ルート ---------- */
app.use('/', worksRoutes);
app.use('/', adminRoutes);
app.use('/', apiRoutes);
app.use('/shorts', shortsRoutes);
app.use('/', analyticsRoutes);

/* ホームだけ直書き */
app.get('/', async (req, res) => {
  const totalWorks    = await Work.countDocuments();
  const totalEpisodes = await Episode.countDocuments();
  const paidEpisodes  = await Episode.find({ isPaid: true });
  const totalRevenue  = paidEpisodes.reduce((s, ep) => s + (ep.price || 0), 0);

  res.render('partials/home', {
    layout: 'layout',
    title: 'ホーム',
    pageStyle: 'home',
    stats: { totalWorks, totalEpisodes, totalRevenue }
  });
});

/* ---------- サーバ ---------- */
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));
