# トラブルシューティングガイド

このドキュメントでは、Views Studioの開発・運用中に発生する可能性がある一般的な問題とその解決策を説明します。

## 目次

1. [一般的なエラー](#一般的なエラー)
2. [フォーム送信の問題](#フォーム送信の問題)
3. [ファイルアップロードの問題](#ファイルアップロードの問題)
4. [データベース関連の問題](#データベース関連の問題)
5. [表示・スタイリングの問題](#表示スタイリングの問題)
6. [パフォーマンスの問題](#パフォーマンスの問題)

## 一般的なエラー

### サーバーが起動しない

**症状**: `npm start`または`npm run dev`を実行してもサーバーが起動しない

**考えられる原因と解決策**:

1. **ポートが既に使用されている**
   - エラーメッセージ: `Error: listen EADDRINUSE: address already in use :::3000`
   - 解決策: 
     - 既存のNode.jsプロセスを終了: `killall node`
     - または別のポートを使用: `PORT=3001 npm start`

2. **依存関係の問題**
   - エラーメッセージ: `Cannot find module 'xxx'`
   - 解決策: `npm install`を実行して依存関係を再インストール

3. **.envファイルの問題**
   - エラーメッセージ: 環境変数関連のエラー
   - 解決策: `.env`ファイルが存在し、必要な環境変数が設定されていることを確認

### ルートが見つからない (404エラー)

**症状**: 特定のURLにアクセスすると404エラーが表示される

**考えられる原因と解決策**:

1. **ルートが正しく定義されていない**
   - `routes`ディレクトリ内のファイルでルートが正しく定義されているか確認
   - `app.js`でルートが正しく登録されているか確認

2. **パスのスペルミス**
   - URLとルート定義のパスが一致しているか確認

3. **メソッドの不一致**
   - 例: POSTリクエストをGETルートに送信している場合など
   - フォームのmethod属性やFetch APIのメソッド指定を確認

## フォーム送信の問題

### Cannot POST/PUT/DELETE エラー

**症状**: フォーム送信時に「Cannot POST/PUT/DELETE to /path」というエラーが表示される

**考えられる原因と解決策**:

1. **method-overrideの問題**
   - `app.js`で`method-override`ミドルウェアが正しく設定されているか確認
   ```javascript
   app.use(methodOverride('_method'));
   ```
   
   - フォームに`_method`パラメータが含まれているか確認
   ```html
   <form method="POST" action="/path?_method=PUT">
     <!-- または -->
     <input type="hidden" name="_method" value="PUT">
   </form>
   ```

2. **JavaScriptによるフォーム送信の問題**
   - `e.preventDefault()`と`form.submit()`の組み合わせがmethod-overrideを無効化している可能性
   - 解決策: Fetch APIを使用してフォームデータを送信
   ```javascript
   fetch('/path?_method=PUT', {
     method: 'POST',
     body: formData
   });
   ```
   
   - または、`e.preventDefault()`を削除して通常のフォーム送信を許可

### フォームデータが保存されない

**症状**: フォーム送信は成功するが、一部のデータが保存されない

**考えられる原因と解決策**:

1. **サーバー側のデータ処理の問題**
   - ルートハンドラで該当フィールドが処理されているか確認
   ```javascript
   // 例: descriptionフィールドが欠落している
   const { title, releaseDate, rating } = req.body;
   // 修正: descriptionを追加
   const { title, description, releaseDate, rating } = req.body;
   ```

2. **フォームフィールドの名前の不一致**
   - フォームのinput要素のname属性がサーバー側の期待する名前と一致しているか確認

3. **バリデーションエラー**
   - モデルのバリデーションルールに違反していないか確認
   - サーバーログでバリデーションエラーを確認

## ファイルアップロードの問題

### ファイルがアップロードされない

**症状**: フォーム送信は成功するが、ファイルがアップロードされない

**考えられる原因と解決策**:

1. **フォームのenctype属性**
   - フォームに`enctype="multipart/form-data"`が設定されているか確認
   ```html
   <form method="POST" enctype="multipart/form-data">
   ```

2. **multerの設定**
   - multerミドルウェアが正しく設定されているか確認
   ```javascript
   const upload = multer({ dest: 'uploads/' });
   router.post('/path', upload.single('fieldName'), handler);
   ```

3. **input要素のname属性**
   - ファイル入力のname属性がmulterの設定と一致しているか確認
   ```html
   <input type="file" name="fieldName">
   ```

### Cloudinaryアップロードエラー

**症状**: ファイルは一時ディレクトリにアップロードされるが、Cloudinaryへの転送に失敗する

**考えられる原因と解決策**:

1. **Cloudinary認証情報の問題**
   - `.env`ファイルのCloudinary認証情報が正しいか確認
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

2. **ファイルサイズの制限**
   - Cloudinaryの無料プランではファイルサイズに制限がある
   - 大きなファイルの場合は、アップロード前に圧縮または最適化を検討

3. **ネットワーク接続の問題**
   - インターネット接続が安定しているか確認
   - Cloudinaryのステータスページでサービス障害がないか確認

## データベース関連の問題

### MongoDBに接続できない

**症状**: サーバー起動時に「MongoDBに接続できません」というエラーが表示される

**考えられる原因と解決策**:

1. **MongoDBサービスが起動していない**
   - MongoDBサービスの状態を確認
   ```bash
   # macOS
   brew services list
   # 必要に応じて起動
   brew services start mongodb-community
   ```

2. **接続文字列の問題**
   - `.env`ファイルのMONGODB_URIが正しいか確認
   ```
   MONGODB_URI=mongodb://localhost:27017/views-studio
   ```

3. **ネットワーク/ファイアウォールの問題**
   - MongoDBのポート(27017)がファイアウォールで許可されているか確認

### データが見つからない

**症状**: 存在するはずのデータが取得できない

**考えられる原因と解決策**:

1. **IDの形式の問題**
   - MongoDBのObjectIDは24文字の16進数
   - IDの形式が正しいか確認
   ```javascript
   // 無効なIDを検出
   if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).send('無効なIDです');
   }
   ```

2. **クエリの条件の問題**
   - クエリ条件が正しいか確認
   ```javascript
   // 例: 大文字小文字を区別しない検索
   const works = await Work.find({ title: new RegExp(searchTerm, 'i') });
   ```

3. **データが実際に存在しない**
   - MongoDBコンパスやコマンドラインツールでデータベースを直接確認

## 表示・スタイリングの問題

### スタイルが適用されない

**症状**: CSSスタイルが一部または全く適用されない

**考えられる原因と解決策**:

1. **CSSファイルのパスの問題**
   - ブラウザの開発者ツールでCSSファイルが正しく読み込まれているか確認
   - パスが正しいか確認
   ```html
   <link rel="stylesheet" href="/css/main.css">
   ```

2. **CSSセレクタの問題**
   - セレクタがHTML要素と一致しているか確認
   - クラス名やID名のスペルミスがないか確認

3. **優先度の問題**
   - より具体的なセレクタや`!important`が他の場所で使用されていないか確認

### レスポンシブデザインの問題

**症状**: モバイル表示が崩れる、または期待通りに動作しない

**考えられる原因と解決策**:

1. **ビューポートメタタグの問題**
   - HTMLヘッダーに適切なビューポートメタタグが設定されているか確認
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. **メディアクエリの問題**
   - メディアクエリのブレークポイントが適切か確認
   ```css
   @media (max-width: 768px) {
     /* モバイル用スタイル */
   }
   ```

3. **フレックスボックス/グリッドの問題**
   - フレックスボックスやグリッドのプロパティが正しく設定されているか確認

### プレビュー表示の問題

**症状**: プレビュー画面が期待通りに表示されない

**考えられる原因と解決策**:

1. **スタイルの統一性の問題**
   - `episodeUpload.css`と`newWork.css`で設定が統一されているか確認
   - ユーザーの好みに合わせた設定が適用されているか確認：
     - プレビュースクリーンの角を丸める（border-radius: 20px）
     - プレビューの位置（top: 150px）
     - 黒背景のシンプルなデザイン

2. **テキスト表示の問題**
   - タイトルのサイズ（font-size: 1rem）
   - あらすじの制限（font-size: 0.88em、2行まで）
   - 詳細ボタンの表示（white-space: nowrap）
   - タイトルの省略表示（max-width: calc(100% - 50px)）

3. **「続きを見る」トグルの問題**
   - 中央配置
   - 青色のグラデーション背景
   - ホバー効果
   - JavaScriptによる行数計算と表示切り替え

## パフォーマンスの問題

### ページ読み込みが遅い

**症状**: ページの読み込みに時間がかかる

**考えられる原因と解決策**:

1. **大きなファイルの問題**
   - 画像や動画ファイルのサイズを最適化
   - Cloudinaryの変換機能を活用して自動最適化

2. **データベースクエリの問題**
   - 不要なフィールドを除外
   ```javascript
   const works = await Work.find().select('title thumbnailUrl').sort({ createdAt: -1 });
   ```
   - インデックスを適切に設定
   ```javascript
   workSchema.index({ title: 'text', tags: 1 });
   ```

3. **N+1クエリの問題**
   - 関連データを一度に取得
   ```javascript
   const works = await Work.find().populate('episodes');
   ```

### メモリリークの問題

**症状**: 長時間の使用でメモリ使用量が増加し、アプリケーションが遅くなる

**考えられる原因と解決策**:

1. **未解放のリソース**
   - 一時ファイルが削除されているか確認
   ```javascript
   if (fs.existsSync(file.path)) {
     fs.unlinkSync(file.path);
   }
   ```

2. **大きなオブジェクトの参照**
   - 不要になったオブジェクトへの参照を解放
   ```javascript
   let largeData = fetchLargeData();
   processData(largeData);
   largeData = null; // 参照を解放
   ```

3. **イベントリスナーの蓄積**
   - 不要になったイベントリスナーを削除
   ```javascript
   element.removeEventListener('click', handler);
   ```

## ログの活用

問題解決のためにログを効果的に活用しましょう：

1. **サーバーログの確認**
   ```bash
   # 直近のログを表示
   tail -f logs/app.log
   ```

2. **ブラウザのコンソールログの確認**
   - ブラウザの開発者ツール（F12）を開き、Consoleタブを確認

3. **デバッグログの追加**
   ```javascript
   console.log('データ:', data);
   console.error('エラー:', error);
   ```

## サポートリソース

問題が解決しない場合は、以下のリソースを活用してください：

1. **プロジェクトドキュメント**
   - [システム概要](../system/overview.md)
   - [データモデル](../models/README.md)
   - [API仕様](../api/README.md)

2. **外部リソース**
   - [Express.js公式ドキュメント](https://expressjs.com/)
   - [Mongoose公式ドキュメント](https://mongoosejs.com/docs/)
   - [Cloudinary公式ドキュメント](https://cloudinary.com/documentation)

3. **開発チームへの連絡**
   - 問題の詳細、再現手順、エラーメッセージを含めてください
