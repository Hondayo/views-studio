# contentsRoutes.js ドキュメント

## 概要

`contentsRoutes.js`はアプリケーションの中核となるルートハンドラーファイルで、作品（Work）とエピソード（Episode）の管理に関する全てのルートを定義しています。このファイルは以下の主要な機能を提供します：

- 作品（Work）の作成、表示、編集、削除
- エピソード（Episode）の作成、表示、編集、削除
- Cloudinaryを使用したメディアファイル（画像・動画）のアップロード・管理
- 管理者ダッシュボードの表示とデータ集計
- 各種APIエンドポイント

## 目次

1. [モジュール構成](#モジュール構成)
2. [ヘルパー関数](#ヘルパー関数)
3. [Work関連ルート](#work関連ルート)
4. [Episode関連ルート](#episode関連ルート)
5. [ダッシュボード＆API関連ルート](#ダッシュボードapi関連ルート)
6. [よくあるエラーと解決法](#よくあるエラーと解決法)

## モジュール構成

```javascript
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const stream     = require('stream');
const cloudinary = require('../config/cloudinary');

const Work    = require('../models/Work');
const Episode = require('../models/Episode');

/* multer (memory) */
const upload = multer({ storage: multer.memoryStorage() });
```

- **express**: Webアプリケーションフレームワーク
- **multer**: ファイルアップロード処理用ミドルウェア（メモリストレージを使用）
- **stream**: ストリーム処理用ユーティリティ
- **cloudinary**: メディアファイル管理用クラウドサービス
- **Work, Episode**: データモデル

## ヘルパー関数

### asyncHandler

```javascript
const asyncHandler = fn => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);
```

非同期関数のエラーを自動的にExpressのエラーハンドラーに渡すためのラッパー関数です。try/catchを書く手間を省きます。

### extractPublicId

```javascript
const extractPublicId = url => {
  const m = url?.match(/\/upload\/(?:v\d+\/)?(.+?)\.(mp4|jpe?g|png|webm)/);
  return m ? m[1] : null;
};
```

CloudinaryのURL文字列からpublic_idを抽出する関数です。リソース削除時に必要となります。

### uploadToCloudinary

```javascript
const uploadToCloudinary = ({ buffer, mimetype }, folder) =>
  new Promise((resolve, reject) => {
    const resource_type = mimetype.startsWith('video') ? 'video' : 'image';
    const up = cloudinary.uploader.upload_stream(
      { resource_type, folder },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.Readable.from(buffer).pipe(up);
  });
```

multerで受け取ったファイルをCloudinaryにアップロードする関数です。mimetype（MIMEタイプ）に基づいて適切なリソースタイプ（video/image）を選択します。

### parseTags

```javascript
const parseTags = tags => (tags ? tags.split(',').map(t => t.trim()) : []);
```

カンマ区切りのタグ文字列を配列に変換する関数です。タグがない場合は空配列を返します。

## Work関連ルート

### 作品一覧 (`GET /contents`)

```javascript
router.get('/contents', asyncHandler(async (_req, res) => {
  const works = await Work.find().sort({ createdAt: -1 });
  const shorts = await ShortClip.find().sort({ createdAt: -1 });
  res.render('partials/contents', {
    layout: 'layout',
    title: 'あなたのコンテンツ',
    pageStyle: 'contents',
    works,
    shorts
  });
}));
```

登録済みの全作品とショートクリップを作成日時の降順で取得し、コンテンツ一覧画面を表示します。`contents.ejs`テンプレートと`contents.css`スタイルシートを使用します。

### 新規作成フォーム (`GET /works/new`)

```javascript
router.get('/works/new', (_req, res) =>
  res.render('partials/newWork', {
    layout: 'layout', title: '新しい作品を作成', pageStyle: 'newWork'
  })
);
```

新しい作品を作成するためのフォームを表示します。`newWork.ejs`テンプレートと`newWork.css`スタイルシートを使用します。

### 作品作成 (`POST /works`)

```javascript
router.post('/works',
  upload.fields([
    { name: 'thumbnail',      maxCount: 1 },
    { name: 'thumbnailVideo', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { title, description, category, tags, rating, releaseDate, cast, studio } = req.body;

    const thumbRes      = req.files?.thumbnail?.[0]      ? await uploadToCloudinary(req.files.thumbnail[0], 'thumbnails') : null;
    const thumbVideoRes = req.files?.thumbnailVideo?.[0] ? await uploadToCloudinary(req.files.thumbnailVideo[0], 'thumbnails') : null;

    const work = await new Work({
      title, description, category, rating, releaseDate, cast, studio,
      thumbnailUrl     : thumbRes?.secure_url     ?? '',
      thumbnailVideoUrl: thumbVideoRes?.secure_url ?? '',
      tags: parseTags(tags)
    }).save();

    res.redirect(`/works/${work._id}/episodes/video?created=1`);
  })
);
```

フォームから送信されたデータを使用して新しい作品を作成します。特徴：

- `multer`を使用して2種類のファイル（サムネイル画像とサムネイル動画）をアップロード
- アップロードされたファイルをCloudinaryにストリーム転送
- カンマ区切りのタグを配列に変換
- 作成後はエピソードアップロードページにリダイレクト（`created=1`パラメータで作成成功メッセージを表示）

### 作品編集フォーム (`GET /works/:id/edit`)

```javascript
router.get('/works/:id/edit', asyncHandler(async (req, res) => {
  const work = await Work.findById(req.params.id);
  if (!work) return res.status(404).send('作品が見つかりません');
  
  // 関連するエピソードも取得
  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });

  // workEdit.ejs を表示
  res.render('partials/workEdit', {
    layout: 'layout',
    title : '作品を編集',
    pageStyle: 'workEdit',
    work,
    episodes
  });
}));
```

指定されたIDの作品編集フォームを表示します。関連するエピソード一覧も一緒に表示するため、エピソードデータも取得します。`workEdit.ejs`テンプレートと`workEdit.css`スタイルシートを使用します。

### 作品更新 (`PUT /works/:id`)

```javascript
router.put('/works/:id', 
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'thumbnailVideo', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { title, description, category, tags, rating, releaseDate, cast, studio } = req.body;
    
    // 更新オブジェクトを準備
    const update = { 
      title, description, category, rating, releaseDate, cast, studio,
      tags: parseTags(tags)
    };
    
    // 新しいサムネイル画像があれば更新
    if (req.files?.thumbnail?.[0]) {
      const thumbRes = await uploadToCloudinary(req.files.thumbnail[0], 'thumbnails');
      update.thumbnailUrl = thumbRes.secure_url;
    }
    
    // 新しいサムネイル動画があれば更新
    if (req.files?.thumbnailVideo?.[0]) {
      const thumbVideoRes = await uploadToCloudinary(req.files.thumbnailVideo[0], 'thumbnails');
      update.thumbnailVideoUrl = thumbVideoRes.secure_url;
    }
    
    // DBを更新
    await Work.findByIdAndUpdate(req.params.id, update);

    // 完了後、作品詳細ページへリダイレクト
    res.redirect(`/works/${req.params.id}`);
  })
);
```

フォームから送信されたデータで作品情報を更新します。特徴：

- 新しいサムネイル画像・動画がある場合のみアップロード処理
- 更新後は作品詳細ページにリダイレクト

### 作品詳細ページ (`GET /works/:id`)

```javascript
router.get('/works/:id', asyncHandler(async (req, res) => {
  const work     = await Work.findById(req.params.id);
  let episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });
  // ShortClip も取得
  const shortClips = await ShortClip.find({ 
    $or: [
      { title: { $regex: work.title, $options: 'i' } },
      { episodeTitle: { $regex: work.title, $options: 'i' } }
    ]
  });

  // エピソードの再生時間を秒から分:秒形式に変換
  episodes = episodes.map(ep => {
    const durationMin = ep.durationSeconds ? Math.floor(ep.durationSeconds / 60) : 0;
    return {
      ...ep._doc,
      durationFormatted: formatMinutesToHMS(durationMin)
    };
  });

  res.render('partials/workDetail', {
    layout: 'layout', title: work.title, bodyClass: 'dark',
    work, episodes, shortClips, created: req.query.created === '1'
  });
}));
```

指定されたIDの作品詳細ページを表示します。特徴：

- 関連するエピソードとショートクリップを取得
- エピソードの再生時間を適切なフォーマットに変換
- `created`クエリパラメータがある場合は作成成功メッセージを表示

### 作品削除 (`DELETE /works/:id`)

```javascript
router.delete('/works/:id', asyncHandler(async (req, res) => {
  const workId = req.params.id;
  const work   = await Work.findById(workId);
  if (!work) return res.status(404).send('作品が見つかりません');

  /* Cloudinaryリソースの削除 */
  // 1) ワーク自体のサムネイル
  if (work.thumbnailUrl) {
    const publicId = extractPublicId(work.thumbnailUrl);
    if (publicId) await cloudinary.uploader.destroy(publicId);
  }
  if (work.thumbnailVideoUrl) {
    const publicId = extractPublicId(work.thumbnailVideoUrl);
    if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  }
  
  /* 2) 関連エピソードのメディア */
  const episodes = await Episode.find({ workId });
  await Promise.all(
    episodes.map(async ep => {
      if (ep.cloudinaryUrl) {
        const publicId = extractPublicId(ep.cloudinaryUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { 
            resource_type: ep.contentType && ep.contentType.startsWith('video') ? 'video' : 'image' 
          });
        }
      }
      if (ep.thumbnailUrl) {
        const publicId = extractPublicId(ep.thumbnailUrl);
        if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      }
    })
  );

  /* 3) DB から削除 */
  await Episode.deleteMany({ workId });
  await Work.findByIdAndDelete(workId);

  res.redirect('/contents');
}));
```

指定されたIDの作品とその関連エピソードを削除します。特徴：

1. 作品のサムネイル画像・動画をCloudinaryから削除
2. 関連する全エピソードのメディアファイルをCloudinaryから削除
3. データベースから関連エピソードと作品を削除
4. 完了後はコンテンツ一覧ページにリダイレクト

## Episode関連ルート

### アップロードフォーム (`GET /works/:id/episodes/video`)

```javascript
router.get('/works/:id/episodes/video', asyncHandler(async (req, res) => {
  const work = await Work.findById(req.params.id);
  if (!work) return res.status(404).send('作品が見つかりません');

  const episodes = await Episode.find({ workId: work._id }).sort({ episodeNumber: 1 });
  const created = req.query.created === '1';

  res.render('partials/uploadEpisode', {
    layout: 'layout',
    title: 'エピソードアップロード',
    pageStyle: 'episodeUpload',
    bodyClass: 'dark',
    work,
    episodes,
    created,
  });
}));
```

指定された作品に新しいエピソードを追加するためのアップロードフォームを表示します。特徴：

- 指定作品の既存エピソード一覧も表示
- `created=1`クエリパラメータがあれば作成成功メッセージを表示
- `uploadEpisode.ejs`テンプレートと`episodeUpload.css`スタイルシートを使用
- ダークモード用の`bodyClass: 'dark'`を設定

### エピソード作成 (`POST /works/:id/episodes`)

```javascript
router.post('/works/:id/episodes',
  upload.fields([
    { name: 'contentFile', maxCount: 1 },
    { name: 'thumbnailImage', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { title, episodeNumber, description, duration } = req.body;
    const price  = parseInt(req.body.price, 10) || 0;
    const isPaid = price > 0;

    // episodeNumber が空なら「最後の +1」とする
    const workId = req.params.id;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).send('作品が見つかりません');

    // ファイルアップロード処理
    const contentFile = req.files.contentFile?.[0];
    if (!contentFile) return res.status(400).send('ファイルが送信されていません');

    // Cloudinaryにアップロード
    const { secure_url, resource_type } = await uploadToCloudinary(contentFile, 'episodes');

    // サムネイル処理（任意）
    const thumbnailFile = req.files.thumbnailImage?.[0];
    const thumbRes = thumbnailFile ? await uploadToCloudinary(thumbnailFile, 'episodesthumbnail') : null;

    // エピソード番号の決定
    let epNum = parseInt(episodeNumber, 10);
    if (Number.isNaN(epNum)) {
      const maxEp = await Episode.findOne({ workId }).sort({ episodeNumber: -1 });
      epNum = (maxEp?.episodeNumber || 0) + 1;
    }

    // DBに保存
    await new Episode({
      workId,
      title,
      episodeNumber: epNum,
      description,
      contentType: resource_type, // 'video' or 'image'
      cloudinaryUrl: secure_url,
      price,
      isPaid,
      duration: duration || '00:00:00',
      thumbnailUrl: thumbRes?.secure_url ?? ''
    }).save();

    // 追加後は同じ画面へ戻り、?created=1 で「追加成功」メッセージ表示
    res.redirect(`/works/${workId}/episodes/video?created=1`);
  })
);
```

フォームから送信されたデータとファイルを使用して新しいエピソードを作成します。特徴：

- `multer`を使用して2種類のファイル（コンテンツファイルとサムネイル画像）をアップロード
- コンテンツファイルは必須だが、サムネイルは任意
- エピソード番号が未指定の場合は、最後のエピソード番号+1を自動割り当て
- 有料エピソードの場合は価格を設定
- 追加後は同じアップロードフォームにリダイレクト（`created=1`パラメータで追加成功メッセージを表示）

### エピソード編集画面 (`GET /works/:workId/episodes/:epId/edit`)

```javascript
router.get('/works/:workId/episodes/:epId/edit', asyncHandler(async (req, res) => {
  const { workId, epId } = req.params;
  const work = await Work.findById(workId);
  const episode = await Episode.findById(epId);
  
  if (!work || !episode) return res.status(404).send('作品またはエピソードが見つかりません');
  
  // 他のエピソードも取得して表示用に
  const episodes = await Episode.find({ workId }).sort({ episodeNumber: 1 });
  
  res.render('partials/episodeedit', {
    layout: 'layout',
    title: 'エピソード編集',
    pageStyle: 'episodeUpload', // 既存のCSSを使用
    bodyClass: 'dark',
    work,
    episode,
    episodes
  });
}));
```

指定されたエピソードの編集画面を表示します。特徴：

- 作品とエピソードの両方の情報を取得
- 同じ作品の他のエピソード一覧も表示
- `episodeedit.ejs`テンプレートを使用し、スタイルはアップロードフォームと同じスタイルシートを再利用

### エピソード更新 (`PUT /works/:workId/episodes/:epId/edit`)

```javascript
router.put('/works/:workId/episodes/:epId/edit', 
  upload.fields([
    { name: 'contentFile', maxCount: 1 },
    { name: 'thumbnailImage', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { workId, epId } = req.params;
    const { title, episodeNumber, description, duration, durationSeconds } = req.body;
    const price = parseInt(req.body.price, 10) || 0;
    const isPaid = price > 0;
    
    const episode = await Episode.findById(epId);
    if (!episode) return res.status(404).send('エピソードが見つかりません');
    
    // エピソード番号の処理
    let epNum = parseInt(episodeNumber, 10);
    if (Number.isNaN(epNum)) {
      epNum = episode.episodeNumber; // 未入力ならそのままの番号を維持
    }
    
    // 更新オブジェクト作成
    const updateData = {
      title,
      episodeNumber: epNum,
      description,
      price,
      isPaid,
      duration: duration || episode.duration
    };
    
    // 秒数が更新されていれば設定
    if (durationSeconds) {
      updateData.durationSeconds = parseInt(durationSeconds, 10);
    }
    
    // 新しい動画ファイルがあれば更新
    const videoFile = req.files?.contentFile?.[0];
    if (videoFile) {
      // 古いCloudinary動画を削除
      if (episode.cloudinaryUrl) {
        const publicId = extractPublicId(episode.cloudinaryUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId, { 
              resource_type: episode.contentType && episode.contentType.startsWith('video') ? 'video' : 'image' 
            });
          } catch (err) {
            console.error('Cloudinary削除エラー:', err);
          }
        }
      }
      
      // 新しい動画をアップロード
      const { secure_url, resource_type } = await uploadToCloudinary(videoFile, 'episodes');
      updateData.cloudinaryUrl = secure_url;
      updateData.contentType = resource_type;
    }
    
    // 新しいサムネイル画像があれば更新
    const thumbnailFile = req.files?.thumbnailImage?.[0];
    if (thumbnailFile) {
      // 古いサムネイルがあれば削除
      if (episode.thumbnailUrl) {
        const publicId = extractPublicId(episode.thumbnailUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
          } catch (err) {
            console.error('Cloudinary削除エラー:', err);
          }
        }
      }
      
      // 新しいサムネイルをアップロード
      const thumbRes = await uploadToCloudinary(thumbnailFile, 'episodesthumbnail');
      updateData.thumbnailUrl = thumbRes.secure_url;
    }
    
    // DBを更新
    await Episode.findByIdAndUpdate(epId, updateData);
    
    // 編集完了後、作品詳細ページへリダイレクト
    res.redirect(`/works/${workId}`);
  })
);
```

フォームから送信されたデータとファイルでエピソード情報を更新します。特徴：

- エピソードの単純なテキスト情報やパラメータだけでなく、動画ファイルやサムネイルも更新可能
- 新しいファイルがアップロードされた場合のみ、古いファイルをCloudinaryから削除
- エラー処理を追加し、Cloudinaryの削除エラーをコンソールに出力してトラッキング
- 編集完了後は作品詳細ページにリダイレクト

### エピソード削除 (`DELETE /works/:workId/episodes/:epId`)

```javascript
router.delete('/works/:workId/episodes/:epId', asyncHandler(async (req, res) => {
  const { workId, epId } = req.params;
  const episode = await Episode.findById(epId);
  if (!episode) return res.status(404).send('エピソードが見つかりません');

  // Cloudinary動画も削除
  if (episode.cloudinaryUrl) {
    const publicId = extractPublicId(episode.cloudinaryUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: episode.contentType && episode.contentType.startsWith('video') ? 'video' : 'image' });
      } catch (err) {
        console.error('Cloudinary削除エラー:', err);
      }
    }
  }
  // DBから削除
  await Episode.deleteOne({ _id: epId });
  // エピソード一覧ページへリダイレクト
  res.redirect(`/works/${workId}`);
}));
```

指定されたエピソードを削除します。特徴：

1. エピソードのCloudinaryメディア（動画または画像）を削除
2. データベースからエピソードを削除
3. 完了後は作品詳細ページにリダイレクト

## ダッシュボード＆API関連ルート

### 管理ダッシュボード (`GET /admin`)

```javascript
router.get('/admin', async (_req, res) => {
  // ① 作品とエピソード
  const works  = await Work.find().lean();
  const eps    = await Episode.find().lean();
  const episodesByWork = eps.reduce((map, ep) => {
    (map[ep.workId] ||= []).push(ep);
    return map;
  }, {});

  // ③ 既存サマリー
  const stats = {
    totalWorks    : works.length,
    totalEpisodes : eps.length,
    totalRevenue  : eps.filter(e => e.isPaid).reduce((s,e)=>s+e.price,0)
  };

  res.render('partials/adminDashboard', {
    layout: 'layout',
    title : 'ダッシュボード',
    pageStyle: 'adminDashboard',
    stats,
    works,
    episodesByWork
  });
});
```

管理者ダッシュボードページを表示します。特徴：

- 全作品とエピソードデータを取得
- エピソードを作品ごとにグループ化（`episodesByWork`オブジェクト）
- 以下の統計情報を計算：
  - 作品総数
  - エピソード総数
  - 有料エピソードからの総収益
- `adminDashboard.ejs`テンプレートと`adminDashboard.css`スタイルシートを使用

### 作品検索API (`GET /api/works`)

```javascript
router.get('/api/works', async (req, res) => {
  const q = req.query.q || '';
  const works = await Work.find({
    isDraft: false,
    title: { $regex: new RegExp(q, 'i') }
  });
  res.json(works);
});
```

作品を検索するAPIエンドポイントです。特徴：

- クエリパラメータ`q`でタイトルの部分一致検索
- 大文字/小文字を区別しない検索（`i`オプション）
- 下書きの作品（`isDraft: false`）のみを検索
- 結果はJSON形式で返却

### 指定作品のエピソード一覧API (`GET /api/works/:id/episodes`)

```javascript
router.get('/api/works/:id/episodes', async (req, res) => {
  try {
    const episodes = await Episode.find({ workId: req.params.id });
    res.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: error.message });
  }
});
```

指定された作品の全エピソードを取得するAPIエンドポイントです。特徴：

- URLパラメータ`:id`で作品IDを指定
- エラー処理を追加し、エラーの詳細をJSONで返却とログ出力
- 結果はJSON形式で返却

### 指定エピソード取得API (`GET /api/works/:workId/episodes/:episodeId`)

```javascript
router.get('/api/works/:workId/episodes/:episodeId', asyncHandler(async (req, res) => {
  const { workId, episodeId } = req.params;
  
  try {
    // 作品とエピソードを同時に取得
    const episode = await Episode.findById(episodeId);
    
    if (!episode) {
      return res.status(404).json({ error: 'エピソードが見つかりません' });
    }
    
    // エピソードデータを返還
    res.json({ episode });
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({ error: error.message });
  }
}));
```

指定されたエピソードの詳細情報を取得するAPIエンドポイントです。特徴：

- URLパラメータ`:workId`と`:episodeId`で作品とエピソードを指定
- 非同期エラーハンドリングのために`asyncHandler`を使用
- 存在しないエピソードの場合は404エラーを返却
- 全てのレスポンスはJSON形式
