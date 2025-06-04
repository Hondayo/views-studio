# テスト戦略

このドキュメントでは、Views Studioのテスト戦略と実装方法について説明します。

## 目次

1. [テスト概要](#テスト概要)
2. [テストの種類](#テストの種類)
3. [テストツール](#テストツール)
4. [テスト環境](#テスト環境)
5. [テスト実行方法](#テスト実行方法)

## テスト概要

Views Studioの品質を確保するために、以下の目標を持ってテストを実施します：

- **機能の正確性**: すべての機能が要件通りに動作することを確認
- **ユーザー体験**: UI/UXが期待通りであることを確認
- **パフォーマンス**: アプリケーションが許容可能な応答時間で動作することを確認
- **セキュリティ**: セキュリティ脆弱性がないことを確認
- **クロスブラウザ互換性**: 主要なブラウザでアプリケーションが正しく動作することを確認

## テストの種類

### 単体テスト (Unit Tests)

個々の関数、メソッド、コンポーネントが正しく動作することを確認します。

**対象**:
- ユーティリティ関数
- モデルのメソッド
- 独立したコンポーネント

**例**:
```javascript
// utils/formatDate.test.js
const { formatDate } = require('../utils/formatDate');

describe('formatDate', () => {
  test('正しい日付フォーマットを返すこと', () => {
    const date = new Date('2023-01-01T00:00:00Z');
    expect(formatDate(date)).toBe('2023/01/01');
  });
  
  test('無効な入力に対してエラーをスローすること', () => {
    expect(() => formatDate('invalid-date')).toThrow();
  });
});
```

### 統合テスト (Integration Tests)

複数のコンポーネントやモジュールが連携して正しく動作することを確認します。

**対象**:
- APIエンドポイント
- データベース操作
- ルートハンドラ

**例**:
```javascript
// routes/contentsRoutes.test.js
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Work = require('../models/Work');

describe('作品API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGODB_URI);
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    await Work.deleteMany({});
  });
  
  test('作品が正常に作成されること', async () => {
    const res = await request(app)
      .post('/works')
      .send({
        title: 'テスト作品',
        description: 'テスト説明'
      });
    
    expect(res.statusCode).toBe(302); // リダイレクト
    
    const works = await Work.find();
    expect(works.length).toBe(1);
    expect(works[0].title).toBe('テスト作品');
  });
  
  // その他のテスト
});
```

### エンドツーエンドテスト (E2E Tests)

実際のユーザーの操作を模倣し、アプリケーション全体が期待通りに動作することを確認します。

**対象**:
- ユーザーフロー
- 複雑な操作シナリオ

**例**:
```javascript
// tests/e2e/workCreation.test.js
describe('作品作成フロー', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });
  
  test('作品が正常に作成されること', async () => {
    await page.goto('http://localhost:3000/works/new');
    await page.fill('input[name="title"]', '新しい作品');
    await page.fill('textarea[name="description"]', '作品の説明');
    
    // ファイルアップロード
    const fileInput = await page.$('input[type="file"][name="thumbnail"]');
    await fileInput.uploadFile('./tests/fixtures/thumbnail.jpg');
    
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // 作成後のリダイレクト先で作品が表示されていることを確認
    const title = await page.textContent('.work-title');
    expect(title).toBe('新しい作品');
  });
});
```

## テストツール

### 主要テストフレームワーク

- **Jest**: 単体テスト、統合テスト用
- **Supertest**: HTTP APIテスト用
- **Playwright/Puppeteer**: E2Eテスト用

### 補助ツール

- **MongoDB Memory Server**: テスト用の一時MongoDBインスタンス
- **Mock Service Worker**: API モックツール
- **Faker.js**: テストデータ生成用
- **Istanbul/nyc**: コードカバレッジ測定用

## テスト環境

### 環境設定

テスト用の環境変数設定例（`.env.test`）:

```
NODE_ENV=test
PORT=3001
TEST_MONGODB_URI=mongodb://localhost:27017/views-studio-test
SESSION_SECRET=test-session-secret
CLOUDINARY_CLOUD_NAME=test-cloud-name
CLOUDINARY_API_KEY=test-api-key
CLOUDINARY_API_SECRET=test-api-secret
```

### テスト用データ

テスト用のデータは `tests/fixtures` ディレクトリに配置します：

- JSON形式のモックデータ
- テスト用の画像・動画ファイル
- シード用のスクリプト

## テスト実行方法

### テストスクリプト

`package.json` に以下のようなテストスクリプトを追加します：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:ci": "jest --ci --coverage"
  }
}
```

### テスト実行コマンド

```bash
# すべてのテストを実行
npm test

# ファイル変更を監視して自動テスト
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage

# E2Eテストを実行
npm run test:e2e
```

## 詳細ドキュメント

テストの詳細については、以下のドキュメントを参照してください：

- [単体テスト戦略](./unit-testing.md)
- [統合テスト戦略](./integration-testing.md)
- [E2Eテスト戦略](./e2e-testing.md)
- [テストデータ準備](./test-data.md)
- [CI/CDパイプラインとテスト](./ci-cd.md)
