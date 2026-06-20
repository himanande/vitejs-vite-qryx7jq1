# 京都検定 3 級 Web 問題集アプリ

## プロジェクト概要

京都検定 3 級の合格を目指すユーザー向けのフリーミアム Web 問題集アプリです。

**目標**: 質の高い問題データ（目標 500 問）を用い、京都検定 3 級の合格率向上を実現する

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Supabase (PostgreSQL + REST API)
- **開発環境**: StackBlitz（本番開発）
- **スタイリング**: ピュア CSS（TailwindCSS 不使用）
- **認証**: Supabase Auth（現在はデモ認証）
- **決済**: Stripe（未実装）

## アプリ構造

カテゴリ(6 個) → テーマ(25 個) → 問題(80+個、目標 500 個)

### カテゴリ ID

1. 歴史・史跡
2. 神社・寺院
3. 食文化
4. 祭りと行事
5. 建築・庭園・美術
6. 芸術・文化

## データベース

### 主要テーブル

- `categories`: カテゴリ（6 件）
- `themes`: テーマ（25 件）
- `questions`: 問題（80+件、目標 500 件）
- `answer_history`: 回答履歴
- `user_profiles`: ユーザープロフィール
- `subscriptions`: サブスクリプション

### RLS 状況

- テスト中のため`categories`, `themes`, `questions`の RLS は**無効化済み**
- **本番運用時には必ず有効化する**

## ビジネスモデル

- **無料会員**: 1 日 10 問制限 + Google 広告表示
- **プレミアム会員**: 無制限 + 広告なし + 高難度問題アクセス

## 重要な設計判断

1. **3 階層構造**: 京都検定の出題範囲が広いため、単純なカテゴリ分類では学習効率が低い
2. **難易度 3 段階**: difficulty_level (1=基礎, 2=応用, 3=上級)で段階的学習を実現
3. **is_premium フラグ**: 問題ごとにプレミアム限定を柔軟に管理
4. **correct_answer**: 0=A, 1=B, 2=C, 3=D（整数で管理）

## API キー管理

Supabase URL: https://brtxljbxesbuxpstnejp.supabase.co

ANON_KEY: （.env から読み込む）

→ `supabaseClient.js` で一括管理。ソースに直書き禁止。

## コンポーネント配置（推奨）

src/

├── components/

│ ├── LoginScreen.tsx

│ ├── Dashboard.tsx

│ ├── ThemeSelector.tsx

│ ├── QuestionScreen.tsx

│ └── ...

├── pages/

├── hooks/

├── utils/

│ └── supabaseClient.js

└── types/

## コーディング規約

- React Hooks 使用（クラスコンポーネント不使用）
- TypeScript/JavaScript 混在は許容（段階的に統一）
- 関数型コンポーネント必須
- CSS Modules or ピュア CSS（Tailwind 不使用）

## 詳細情報の参照先

- **handoff.md**: 引き継ぎ資料（現在の問題・完了タスク・テスト結果）
- **system-overview.md**: システム構成図・DB スキーマ・API 一覧
- **Supabase URL**: https://app.supabase.com/

## 本番環境への推移

- **認証**: 現在のデモ認証から Supabase Auth OAuth へ移行予定
- **RLS**: categories, themes, questions を有効化予定
- **API キー**: 環境変数分離予定
- **広告**: Google AdSense 実装予定

## 次に実施すべき作業

優先度順:

1. UI/UX 修正（レスポンシブ・次へボタン）
2. 問題データの大量追加（テーマ ID 4-25）
3. 学習進捗の DB 保存
4. Supabase Auth 実装
5. Stripe 決済連携
