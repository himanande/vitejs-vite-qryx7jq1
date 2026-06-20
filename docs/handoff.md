# 京都検定 3 級 Web 問題集アプリ - Claude Code 引き継ぎ資料

## 基本情報

**プロジェクト名**: 京都検定 3 級 Web 問題集
**開発環境**: StackBlitz
**技術スタック**: React + TypeScript + Supabase (PostgreSQL)
**進捗**: 約 60%完了

---

## 現在の状況

### ✅ 完了済み

- Supabase プロジェクト作成・テーブル設計完了
- 6 カテゴリ・25 テーマの構造構築
- 問題データ 80 問以上投入（テーマ ID 1-3 は充実）
- フロントエンド基本実装（ログイン・ダッシュボード・問題表示）
- Supabase REST API 接続成功

### 🔄 進行中・未完了

#### 優先度高

- **UI/UX 修正**
  - レスポンシブ対応（ログイン画面が左寄り）
  - 次へボタン実装（自動進行を停止）
  - 1 周完了で終了する機能
- **問題データ大量追加**（テーマ ID 4-25 各 10 問以上）
- **theme_id が未設定の問題修正**

#### 優先度中

- 学習進捗 DB 保存（answer_history への記録）
- 復習システム
- 弱点分析機能

#### 優先度低

- 本番認証実装（Supabase Auth OAuth）
- 決済連携（Stripe）
- 広告実装（Google AdSense）

---

## 現在の問題

### 1. UI レスポンシブ未対応

- **症状**: ログイン画面が左寄り（フルブラウザ表示時）
- **原因**: CSS の margin/width 未設定
- **修正**: `body, html, .login-container` に width:100%・margin:0 を追加

### 2. 自動進行問題

- **症状**: 回答後 3 秒で自動的に次の問題へ進む
- **原因**: `handleAnswer`内の setTimeout
- **修正**: setTimeout を削除し次へボタン実装

### 3. 問題が表示されないテーマがある

- **症状**: テーマ選択後に「問題準備中」画面が表示される
- **原因**: theme_id が問題に正しく設定されていない
- **修正 SQL**:

```sql
UPDATE questions SET theme_id = 1 WHERE id IN (6, 7);
UPDATE questions SET theme_id = 5 WHERE id IN (8, 9);
UPDATE questions SET theme_id = 12 WHERE id = 10;
UPDATE questions SET theme_id = 10 WHERE id = 11;
UPDATE questions SET theme_id = 16 WHERE id = 12;
UPDATE questions SET theme_id = 20 WHERE id = 13;
```

### 4. 本番認証未実装

- **現状**: デモ認証のみ（user.id = "demo-google-user"等の固定値）
- **影響**: answer_history への保存など、実ユーザー ID が必要な機能が機能しない

---

## Supabase 接続情報

URL: https://brtxljbxesbuxpstnejp.supabase.co

ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydHhsamJ4ZXNidXhwc3RuZWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MzA4OTQsImV4cCI6MjA2OTQwNjg5NH0.H4I1Rc9lB5lqSSkR4joD0tZw2rEbnesVOuUw9bL3tpA

### テーブル一覧

- **categories**（6 件、RLS 無効化）
- **themes**（25 件、RLS 無効化）
- **questions**（80+件、RLS 無効化）
- **answer_history**（RLS 有効）
- **user_profiles**（RLS 有効）
- **bookmarks**（RLS 有効）
- **study_sessions**（RLS 有効）
- **subscriptions**（RLS 有効）
- **payments**（RLS 有効）
- **announcements**
- **system_settings**

---

## コード構成

src/

├── App.tsx（または App.js） # メインコンポーネント：全ての画面実装

├── App.css # スタイリング（ピュア CSS、TailwindCSS 不使用）

├── supabaseClient.js # Supabase クライアント設定

└── main.tsx # エントリーポイント

### App.tsx の主要部分

#### State 管理

```typescript
const [user, setUser] = useState(null);
const [categories, setCategories] = useState([]);
const [themes, setThemes] = useState([]);
const [questions, setQuestions] = useState([]);
const [currentQuestion, setCurrentQuestion] = useState(null);
const [currentView, setCurrentView] = useState('login');
const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedTheme, setSelectedTheme] = useState(null);
const [answerResult, setAnswerResult] = useState(null);
```

#### 画面遷移フロー

1. **ログイン画面** → Google/Twitter/メール認証
2. **ダッシュボード** → 統計カード + カテゴリ一覧
3. **テーマ選択** → カテゴリ内のテーマ表示
4. **問題画面** → 問題・選択肢・正誤判定・解説

#### 主要関数

- `handleLogin()`: デモ認証処理
- `handleLogout()`: ログアウト
- `loadCategories()`: Supabase からカテゴリ取得
- `loadThemes()`: Supabase からテーマ取得
- `loadQuestions()`: Supabase から問題取得
- `handleCategorySelect()`: カテゴリ選択
- `handleThemeSelect()`: テーマ選択
- `handleAnswer()`: 回答処理
- `goToNextQuestion()`: 次の問題へ（未実装）

---

## 次に実施すべき作業（優先度順）

### 1. **UI 修正（App.css）** - 1-2 時間

```css
body, html {
  width: 100%;
  margin: 0;
  padding: 0;
}
.login-container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
```

### 2. **次へボタン実装（App.tsx）** - 2-3 時間

- `handleAnswer`から setTimeout を削除
- `goToNextQuestion`関数を追加
- 解説表示後に「次の問題へ →」ボタンを表示
- 最終問題後は「テーマ完了」画面を表示

### 3. **問題データ修正と追加** - 5-8 時間

- Supabase SQL Editor で既存問題の theme_id 修正
- 各テーマに 10 問以上追加（現在 80 問 → 目標 250 問）

### 4. **学習進捗 DB 保存** - 3-4 時間

```javascript
await supabase.from('answer_history').insert({
  user_id: user.id,
  question_id: currentQuestion.id,
  selected_answer: selectedOption,
  is_correct: isCorrect,
  study_mode: 'normal'
});
```

### 5. **その他機能** - 後次

- Supabase Auth 本番実装
- 復習システム・統計機能
- Stripe 決済・Google AdSense

---

## 開発時の注意事項

- API キーは `supabaseClient.js` で一括管理（ソースに直書き禁止）
- categories, themes, questions の RLS は**本番で必ず有効化**
- コンポーネントは TypeScript/JavaScript 混在許容（段階的に統一予定）
- スタイリングはピュア CSS（TailwindCSS 不使用）

---

## テスト確認

StackBlitz で自動実行されているため、プレビューウィンドウで動作確認：

- ログイン画面が表示されるか
- ブラウザコンソールにエラーがないか
- Supabase からデータが取得できているか

---

## 詳細情報の参照先

- **システム構成図**: system-overview.md
- **DB スキーマ詳細**: system-overview.md 内の DB Schema
- **API 一覧**: system-overview.md 内の API 一覧
- **未解決課題**: system-overview.md
