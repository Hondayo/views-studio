# フロントエンド実装ガイド

このドキュメントでは、Views Studioのフロントエンド実装について説明します。
フロントエンドはEJSテンプレートエンジンを使用したサーバーサイドレンダリングと、クライアントサイドJavaScriptによる動的機能の組み合わせで構成されています。

## 目次

1. [ディレクトリ構造](#ディレクトリ構造)
2. [テンプレート構成](#テンプレート構成)
3. [JavaScript機能](#javascript機能)
4. [CSSスタイリング](#cssスタイリング)
5. [UI設計原則](#ui設計原則)
6. [フォーム処理](#フォーム処理)
7. [メディアプレビュー](#メディアプレビュー)

## ディレクトリ構造

```
views-studio/
├── views/                # EJSテンプレート
│   ├── partials/         # 共通パーツ
│   │   ├── header.ejs    # ヘッダー
│   │   ├── footer.ejs    # フッター
│   │   ├── sidebar.ejs   # サイドバー
│   │   └── ...
│   ├── index.ejs         # トップページ
│   ├── works/            # 作品関連ページ
│   ├── episodes/         # エピソード関連ページ
│   └── ...
├── public/               # 静的ファイル
│   ├── js/               # クライアントサイドJavaScript
│   │   ├── main.js       # 共通スクリプト
│   │   ├── uploadEpisode.js # エピソードアップロード
│   │   ├── episodeEdit.js  # エピソード編集
│   │   └── ...
│   ├── css/              # スタイルシート
│   │   ├── main.css      # メインスタイル
│   │   └── ...
│   └── images/           # 画像ファイル
└── stylesheet/           # カスタムスタイルシート
    ├── pages/            # ページ別スタイル
    │   ├── contents.css  # コンテンツページ
    │   └── ...
    └── components/       # コンポーネント別スタイル
```

## テンプレート構成

### ベーステンプレート

すべてのページは基本的に以下の構造を持ちます：

```html
<%- include('../partials/header') %>

<main class="container">
  <!-- ページ固有のコンテンツ -->
</main>

<%- include('../partials/footer') %>
```

### 共通パーツ

- **header.ejs**: ナビゲーションバー、メタタグ、CSSの読み込み
- **footer.ejs**: フッター情報、共通JavaScriptの読み込み
- **sidebar.ejs**: サイドナビゲーション（必要なページで使用）
- **episodeedit.ejs**: エピソード編集フォーム
- **workform.ejs**: 作品登録・編集フォーム

### データの受け渡し

EJSテンプレートにデータを渡す方法：

```javascript
// ルートハンドラ内
res.render('works/detail', {
  work: workData,
  episodes: episodesData,
  user: req.user
});
```

テンプレート内でのデータ使用：

```html
<h1><%= work.title %></h1>
<p><%= work.description %></p>

<% if (episodes.length > 0) { %>
  <ul>
    <% episodes.forEach(episode => { %>
      <li><%= episode.title %></li>
    <% }); %>
  </ul>
<% } else { %>
  <p>エピソードはまだありません</p>
<% } %>
```

## JavaScript機能

### 主要なJavaScriptファイル

- **main.js**: 共通機能（ナビゲーション、モーダル、ユーティリティ関数）
- **uploadEpisode.js**: エピソードアップロード処理
- **episodeEdit.js**: エピソード編集処理
- **workForm.js**: 作品登録・編集処理
- **topbar.js**: トップバーの動的機能
- **preview.js**: メディアプレビュー機能

### イベントハンドリング

基本的なイベントハンドリングパターン：

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // DOM要素の取得
  const form = document.getElementById('episodeForm');
  
  // イベントリスナーの設定
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
  
  // その他の初期化処理
  initializeComponents();
});

// イベントハンドラ関数
function handleFormSubmit(e) {
  e.preventDefault();
  
  // フォームデータの処理
  const formData = new FormData(e.target);
  
  // APIリクエスト
  submitFormData(formData);
}
```

### 非同期処理

Fetch APIを使用した非同期リクエスト：

```javascript
async function submitFormData(formData) {
  try {
    // UI更新（ローディング表示など）
    showLoading();
    
    // APIリクエスト
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: formData
    });
    
    // レスポンス処理
    const data = await response.json();
    
    if (data.success) {
      // 成功時の処理
      showSuccess(data.message);
      redirectToPage(data.redirectUrl);
    } else {
      // エラー時の処理
      showError(data.error.message);
    }
  } catch (error) {
    // 例外処理
    console.error('Error:', error);
    showError('予期せぬエラーが発生しました');
  } finally {
    // 後処理
    hideLoading();
  }
}
```

### メソッドオーバーライド

HTMLフォームからPUT/DELETEリクエストを送信する方法：

1. フォームに隠しフィールドを追加：
```html
<input type="hidden" name="_method" value="PUT">
```

2. フォームのaction属性にクエリパラメータを追加：
```html
<form action="/endpoint?_method=PUT" method="POST">
```

3. JavaScriptでFetch APIを使用：
```javascript
fetch('/endpoint?_method=PUT', {
  method: 'POST',
  body: formData
});
```

## CSSスタイリング

### スタイルシートの構成

- **main.css**: 基本スタイル、グローバル変数、リセットCSS
- **contents.css**: コンテンツページのスタイル
- **episodeUpload.css**: エピソードアップロードページのスタイル
- **newWork.css**: 作品登録ページのスタイル

### デザイン原則

- モバイルファーストのレスポンシブデザイン
- ダークテーマをベースにした配色
- 一貫したスペーシングとタイポグラフィ

### プレビュー表示のスタイリング

ユーザーの好みに基づいた設定：

```css
/* プレビュー画面のスタイル */
.preview-screen {
  border-radius: 20px;
  top: 150px;
  background-color: #000;
}

/* タイトルのスタイル */
.preview-title {
  font-size: 1rem;
  max-width: calc(100% - 50px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* あらすじのスタイル */
.preview-description {
  font-size: 0.88em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 「続きを見る」トグルのスタイル */
.toggle-more {
  background: linear-gradient(to right, transparent, rgba(0, 136, 255, 0.1), transparent);
  text-align: center;
  padding: 5px;
  cursor: pointer;
}

.toggle-more:hover {
  background: linear-gradient(to right, transparent, rgba(0, 136, 255, 0.2), transparent);
}

/* 詳細表示部分のスタイル */
.details-section {
  background: rgba(68, 68, 68, 0.3);
  border-radius: 10px;
  padding: 15px;
}

.details-button {
  white-space: nowrap;
}
```

## UI設計原則

### プレビュー表示

1. グレーのスマホフレームは不要（削除済み）
2. プレビュースクリーンの角は丸め（border-radius: 20px）
3. プレビューの位置は少し下げる（top: 150px）
4. 黒背景のシンプルなデザイン

### テキスト表示

1. 作品タイトルとエピソードタイトルは同じサイズ（font-size: 1rem）に統一
2. あらすじは小さめのサイズ（font-size: 0.88em）で2行までに制限
3. 詳細ボタンは常に横に表示され、改行されない（white-space: nowrap）
4. タイトルは長い場合に省略表示（max-width: calc(100% - 50px)）

### あらすじ表示

1. 2行を超えるあらすじは「続きを見る」トグルを表示
2. クリックで全文表示/折りたたみ切り替え
3. 「続きを見る」「閉じる」のテキスト切り替え

### 「続きを見る」トグル

1. プレビュー画面の中央に配置
2. 青色のグラデーション背景を適用
3. ホバー時に背景色を濃くする

### 詳細表示部分

1. 詳細ボタンは横に固定表示（white-space: nowrap）
2. 詳細表示部分は背景色を暗めに設定（background: rgba(68, 68, 68, 0.3)）
3. 角丸と適切なパディングで視認性を向上
4. 年やレーティングなどのバッジは横並びで表示

## フォーム処理

### フォーム送信

基本的なフォーム送信処理：

1. フォームの送信イベントをキャプチャ
2. FormDataオブジェクトを作成
3. 必要に応じてデータを検証・加工
4. Fetch APIを使用してサーバーにデータを送信
5. レスポンスに基づいてUIを更新

```javascript
// フォーム送信処理の例
document.getElementById('episodeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 送信ボタンの状態を更新
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitBtnSpinner = document.getElementById('submitBtnSpinner');
  
  if (submitBtn && submitBtnText && submitBtnSpinner) {
    submitBtn.disabled = true;
    submitBtnText.style.display = 'none';
    submitBtnSpinner.style.display = 'inline-flex';
  }
  
  // フォームデータを送信
  try {
    const formData = new FormData(e.target);
    const response = await fetch(e.target.action, {
      method: e.target.method,
      body: formData
    });
    
    if (response.redirected) {
      window.location.href = response.url;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('エラーが発生しました');
    
    // エラー時にボタンを元に戻す
    if (submitBtn && submitBtnText && submitBtnSpinner) {
      submitBtn.disabled = false;
      submitBtnText.style.display = 'inline';
      submitBtnSpinner.style.display = 'none';
    }
  }
});
```

## メディアプレビュー

### 画像プレビュー

```javascript
function previewImage(input, previewElement) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      previewElement.src = e.target.result;
      previewElement.style.display = 'block';
    };
    
    reader.readAsDataURL(input.files[0]);
  }
}
```

### 動画プレビュー

```javascript
function previewVideo(input, previewElement) {
  if (input.files && input.files[0]) {
    const url = URL.createObjectURL(input.files[0]);
    previewElement.src = url;
    previewElement.style.display = 'block';
    
    // リソースの解放
    previewElement.onload = function() {
      URL.revokeObjectURL(url);
    };
  }
}
```

## 次のステップ

フロントエンド実装の詳細については、以下のドキュメントを参照してください：

- [JavaScript機能詳細](./javascript.md)
- [CSSスタイリング詳細](./styling.md)
- [テンプレート構成詳細](./templates.md)
- [UIコンポーネント](./components.md)
