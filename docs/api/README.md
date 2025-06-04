# API仕様書

このドキュメントでは、Views StudioのAPIエンドポイントとその使用方法について説明します。
システムはRESTful APIの原則に基づいて設計されており、主にHTTP GET、POST、PUT、DELETEメソッドを使用します。

## API概要

Views StudioのAPIは主に以下のリソースを操作するためのエンドポイントを提供しています：

1. 作品（Works）
2. エピソード（Episodes）
3. ショートクリップ（ShortClips）
4. ユーザー（Users）
5. 分析データ（Analytics）

## 認証

現在、APIは内部使用を目的としており、認証システムは将来的な実装として計画されています。
将来的には、JWT（JSON Web Token）ベースの認証システムを導入する予定です。

## API一覧

### 作品（Works）

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/works` | 作品一覧の取得 |
| GET | `/works/:id` | 特定の作品の詳細取得 |
| POST | `/works` | 新規作品の登録 |
| PUT | `/works/:id` | 作品情報の更新 |
| DELETE | `/works/:id` | 作品の削除 |

詳細: [作品API仕様](./works-api.md)

### エピソード（Episodes）

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/works/:workId/episodes` | 特定の作品のエピソード一覧取得 |
| GET | `/works/:workId/episodes/:epId` | 特定のエピソード詳細取得 |
| POST | `/works/:workId/episodes` | 新規エピソード登録 |
| PUT | `/works/:workId/episodes/:epId/edit` | エピソード情報の更新 |
| DELETE | `/works/:workId/episodes/:epId` | エピソードの削除 |

詳細: [エピソードAPI仕様](./episodes-api.md)

### ショートクリップ（ShortClips）

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/shortclips` | ショートクリップ一覧取得 |
| GET | `/shortclips/:id` | 特定のショートクリップ詳細取得 |
| POST | `/shortclips` | 新規ショートクリップ登録 |
| PUT | `/shortclips/:id` | ショートクリップ情報の更新 |
| DELETE | `/shortclips/:id` | ショートクリップの削除 |

詳細: [ショートクリップAPI仕様](./shortclips-api.md)

### 分析データ（Analytics）

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/analytics/works/:workId` | 特定の作品の分析データ取得 |
| GET | `/analytics/episodes/:epId` | 特定のエピソードの分析データ取得 |
| POST | `/analytics/record` | 視聴データの記録 |

詳細: [分析API仕様](./analytics-api.md)

## リクエスト形式

### クエリパラメータ

一覧取得APIでは、以下のクエリパラメータがサポートされています：

- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 10、最大: 50）
- `sort`: ソートフィールド（例: `title`, `createdAt`）
- `order`: ソート順（`asc` または `desc`、デフォルト: `desc`）
- `search`: 検索キーワード
- `tags`: タグによるフィルタリング（カンマ区切りで複数指定可能）

### リクエストボディ

POST/PUTリクエストでは、JSONまたはmultipart/form-dataフォーマットでデータを送信します：

- JSONフォーマット: テキストデータのみの場合
- multipart/form-data: ファイルアップロードを含む場合

## レスポンス形式

すべてのAPIレスポンスは以下の共通構造を持ちます：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作が成功しました"
}
```

エラーの場合：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

## エラーコード

| コード | 説明 |
|-------|------|
| 400 | Bad Request - リクエストパラメータが無効 |
| 401 | Unauthorized - 認証が必要 |
| 403 | Forbidden - 権限がない |
| 404 | Not Found - リソースが見つからない |
| 500 | Internal Server Error - サーバー内部エラー |

## メソッドオーバーライド

HTMLフォームからPUT/DELETEリクエストを送信する場合、以下のいずれかの方法でメソッドオーバーライドを使用します：

1. クエリパラメータ: `?_method=PUT`
2. 隠しフィールド: `<input type="hidden" name="_method" value="PUT">`

## ファイルアップロード

ファイルアップロードを含むエンドポイントでは、以下の点に注意してください：

- リクエストは `multipart/form-data` 形式で送信する必要があります
- ファイルサイズ制限: 画像 10MB、動画 500MB
- サポートされるファイル形式:
  - 画像: jpg, jpeg, png, gif
  - 動画: mp4, mov, avi, webm

## 使用例

### 作品一覧の取得

```javascript
// クライアントサイドJavaScript例
fetch('/works?page=1&limit=10&sort=createdAt&order=desc')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### 新規作品の登録

```javascript
// multipart/form-dataを使用したファイルアップロード例
const formData = new FormData();
formData.append('title', '作品タイトル');
formData.append('description', '作品の説明');
formData.append('releaseDate', '2025-01-01');
formData.append('rating', 'G');
formData.append('tags', 'アクション,冒険');
formData.append('thumbnail', thumbnailFile);

fetch('/works', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 次のステップ

各APIの詳細については、対応するドキュメントを参照してください：

- [作品API仕様](./works-api.md)
- [エピソードAPI仕様](./episodes-api.md)
- [ショートクリップAPI仕様](./shortclips-api.md)
- [分析API仕様](./analytics-api.md)
