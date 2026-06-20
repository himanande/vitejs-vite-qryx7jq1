了解です！handoff.md と system-overview.md の完全なコンテンツを改めて提供します。

handoff.md
markdown# 京都検定 3 級 Web 問題集アプリ - Claude Code 引き継ぎ資料

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

system-overview.md
markdown# システム構成・技術資料

## システムアーキテクチャ

[ユーザーブラウザ]

↓

[React フロントエンド (StackBlitz)]

↓ REST API (@supabase/supabase-js)

[Supabase]

├── PostgreSQL Database

├── Row Level Security (RLS)

├── Authentication（未実装）

└── REST API（自動生成）

---

## ディレクトリ構成

vitejs-vite-qryx7jq1/（StackBlitz プロジェクト）

├── CLAUDE.md

├── settings.json

├── Skills.md

├── docs/

│ ├── handoff.md

│ └── system-overview.md

├── src/

│ ├── App.tsx

│ ├── App.css

│ ├── supabaseClient.js

│ ├── main.tsx

│ └── ...

├── public/

├── package.json

├── vite.config.ts

├── tsconfig.json

└── ...

---

## DB スキーマ

### categories

```sql
id: SERIAL PRIMARY KEY
name: VARCHAR(100) UNIQUE NOT NULL
description: TEXT
display_order: INTEGER DEFAULT 0
is_active: BOOLEAN DEFAULT TRUE
created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**現在のデータ:**

1. 歴史・史跡
2. 神社・寺院
3. 食文化
4. 祭りと行事
5. 建築・庭園・美術
6. 芸術・文化

### themes

```sql
id: SERIAL PRIMARY KEY
category_id: INTEGER REFERENCES categories(id) NOT NULL
name: VARCHAR(200) NOT NULL
description: TEXT
display_order: INTEGER DEFAULT 0
is_active: BOOLEAN DEFAULT TRUE
created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**現在のデータ:** 25 テーマ

- カテゴリ 1 配下：3 テーマ（四神相応・嵐山・渡月橋など）
- カテゴリ 2 配下：4 テーマ（清水寺など）
- カテゴリ 3 配下：4 テーマ（京野菜など）
- その他：各 3-6 テーマ

### questions

```sql
id: SERIAL PRIMARY KEY
category_id: INTEGER REFERENCES categories(id)
theme_id: INTEGER REFERENCES themes(id)
question_text: TEXT NOT NULL
option_a / option_b / option_c / option_d: VARCHAR(500) NOT NULL
correct_answer: INTEGER NOT NULL (0=A, 1=B, 2=C, 3=D)
explanation: TEXT
difficulty_level: INTEGER DEFAULT 1 (1=基礎, 2=応用, 3=上級)
is_premium: BOOLEAN DEFAULT FALSE
is_active: BOOLEAN DEFAULT TRUE
created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**現在のデータ:** 80+問

- テーマ ID 1（四神相応）：30 問 ✅
- テーマ ID 2（嵐山・渡月橋）：25 問 ✅
- テーマ ID 3（嵯峨野観光鉄道）：25 問 ✅
- その他テーマ（ID 4-25）：各 0-2 問（追加必要）

### answer_history

```sql
id: SERIAL PRIMARY KEY
user_id: UUID REFERENCES auth.users(id) NOT NULL
question_id: INTEGER REFERENCES questions(id) NOT NULL
selected_answer: INTEGER NOT NULL (0=A, 1=B, 2=C, 3=D)
is_correct: BOOLEAN NOT NULL
answered_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**用途**: ユーザーの回答を記録。統計・復習に使用。

### user_profiles

```sql
id: UUID REFERENCES auth.users(id) PRIMARY KEY
display_name: VARCHAR(100)
avatar_url: TEXT
provider: VARCHAR(20)
is_premium: BOOLEAN DEFAULT FALSE
daily_question_count: INTEGER DEFAULT 0
total_questions_answered: INTEGER DEFAULT 0
total_correct_answers: INTEGER DEFAULT 0
created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**用途**: ユーザープロフィール拡張。プレミアム判定に使用。

### その他テーブル

- **bookmarks**: ブックマーク機能用
- **study_sessions**: 学習セッション記録
- **subscriptions**: サブスクリプション管理
- **payments**: 決済履歴
- **announcements**: お知らせ
- **system_settings**: システム設定

---

## API 一覧

### Supabase REST API（自動生成）

| エンドポイント          | メソッド        | 用途             | 実装状況    |
| ----------------------- | --------------- | ---------------- | ----------- |
| /rest/v1/categories     | GET             | カテゴリ一覧取得 | ✅ 実装済み |
| /rest/v1/themes         | GET             | テーマ一覧取得   | ✅ 実装済み |
| /rest/v1/questions      | GET             | 問題取得         | ✅ 実装済み |
| /rest/v1/answer_history | POST            | 回答履歴保存     | ❌ 未実装   |
| /rest/v1/user_profiles  | GET/PUT         | プロフィール操作 | ❌ 未実装   |
| /rest/v1/bookmarks      | GET/POST/DELETE | ブックマーク管理 | ❌ 未実装   |

---

## 環境変数

VITE_SUPABASE_URL=https://brtxljbxesbuxpstnejp.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**注**: StackBlitz では src パス内の supabaseClient.js に直接記述。

---

## 未解決課題

| 課題                    | 優先度 | 影響度                     |
| ----------------------- | ------ | -------------------------- |
| UI レスポンシブ未対応   | 高     | 中（ログイン画面左寄り）   |
| theme_id が未設定の問題 | 高     | 高（問題が表示されない）   |
| 自動進行問題            | 高     | 中（UX 悪化）              |
| 問題データが少ない      | 中     | 中（学習効率低下）         |
| answer_history 未保存   | 中     | 高（進捗記録できない）     |
| 本番認証未実装          | 中     | 高（実ユーザー ID が不明） |
| RLS 本番設定未実施      | 中     | 高（セキュリティリスク）   |

---

## 技術的負債

| 負債                   | 内容                             | 対処方法                        |
| ---------------------- | -------------------------------- | ------------------------------- |
| デモ認証のみ           | user.id が固定値                 | Supabase Auth 実装              |
| ピュア CSS のみ        | 保守性低                         | Tailwind 導入検討（オプション） |
| エラーハンドリング不足 | ネットワークエラー時の UI 未対応 | try-catch 拡充                  |
| テスト未実装           | 単体テストなし                   | Jest/Vitest 導入                |
| API キーの管理         | ソース直書き                     | 環境変数化予定                  |

---

## 本番環境への推移予定

- **認証**: デモ認証 → Supabase Auth OAuth（Google/Twitter）
- **RLS**: 無効化 → 有効化（categories, themes, questions）
- **決済**: 未実装 → Stripe（月額 980 円、年額 9800 円）
- **広告**: 未実装 → Google AdSense（無料会員のみ）
- **問題数**: 80 問 → 目標 500 問

---

## 今後のロードマップ（Phase 別）

### Phase 1: 緊急修正（今週）

- UI/UX レスポンシブ対応
- 次へボタン・自動進行停止
- theme_id 修正
- 問題データ大量追加（目標 100 問）

### Phase 2: 機能充実（2-3 週間後）

- 学習進捗 DB 保存（answer_history）
- 復習システム
- 弱点分析機能
- 問題数 150 問到達

### Phase 3: 試験対策機能（1 ヶ月後）

- 模擬試験（90 分・100 問）
- 詳細スコア分析
- 問題数 250 問到達

### Phase 4: プレミアム・収益化（1.5 ヶ月後）

- Supabase Auth 本番実装
- Stripe 決済連携
- Google AdSense 実装
- 問題数 350 問到達

### Phase 5: 運用・管理（2 ヶ月後）

- 管理者ダッシュボード
- 問題管理システム
- 問題数 450 問到達

### Phase 6: 拡張（3 ヶ月後）

- PWA 化
- オフライン機能
- プッシュ通知
- 問題数 500 問到達
- 京都検定 2 級・1 級対応検討

---

## 重要なルール

- **API キー**: ソースに直書き禁止、supabaseClient.js で一括管理
- **RLS**: 本番で必ず有効化
- **コンポーネント**: src/components に配置（将来的に分割）
- **スタイル**: ピュア CSS（App.css）
- **認証**: 現在デモ用、将来 Supabase Auth 実装予定

---

## StackBlitz での開発フロー

1. **ファイル編集** → 中央のエディタで編集
2. **自動保存** → ファイル保存で自動反映
3. **プレビュー確認** → 右側のプレビューウィンドウで確認
4. **コンソール確認** → F12 でブラウザコンソール開く
5. **エラー対応** → コンソールエラーを確認して修正

---

## Supabase 接続確認

### SQL Editor でのテスト

```sql
-- カテゴリ取得確認
SELECT * FROM categories LIMIT 5;

-- テーマ取得確認
SELECT * FROM themes WHERE category_id = 1;

-- 問題取得確認
SELECT * FROM questions WHERE theme_id = 1 LIMIT 3;
```

### StackBlitz コンソールでのテスト

```javascript
// 開発者ツールで実行
import { supabase } from './supabaseClient.js';

const { data, error } = await supabase
  .from('categories')
  .select('*');
console.log(data, error);
```
