# 京都検定 3 級 Web 問題集アプリ(v2)

## プロジェクト概要

京都検定 3 級の合格を目指すユーザー向けのフリーミアム Web 問題集アプリ。
2026-08 に v1(モノリス構成)を廃止し、`docs/requirements-v2.md` の要件定義に基づいて再構築した。

**ドキュメントの優先順位**: `docs/requirements-v2.md` が唯一の正。
`docs/handoff.md` / `docs/system-overview.md` は v1 時代の資料であり、実態と乖離した記載を含む(参考程度に扱う)。

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite
- **バックエンド**: Supabase(PostgreSQL + Auth + RLS)
- **スタイリング**: ピュア CSS(TailwindCSS 不使用)。コンポーネントごとに同名 .css を配置
- **テスト**: Vitest + React Testing Library(`npm test`)
- **CI**: GitHub Actions(push ごとに build + test)

## アプリ構造

カテゴリ(6) → テーマ(24・有効のみ) → 問題(534 問)

演習モード: テーマ別 / カテゴリ別(複数選択可) / 総合(全問ランダム)

## データベース

- **Supabase プロジェクト**: `wcsurvnglqazxlckgxxg`(URL・anon key は `.env`)
- **テーブル**: categories / themes / questions / answer_history / user_profiles
- **マイグレーション**: `docs/migration_v2.sql`(冪等。Supabase SQL Editor で実行)
- **RLS は全テーブル有効**。1 日 10 問制限も answer_history の INSERT ポリシーで DB 側で強制
- `correct_answer`: 0=A, 1=B, 2=C, 3=D / `difficulty_level`: 1=基礎, 2=応用, 3=上級

## コード構成の原則

- `src/lib/quizLogic.ts`: Supabase に依存しない純粋ロジック(必ずテストを書く)
- `src/lib/quizApi.ts`: Supabase アクセスの唯一の窓口
- `src/App.tsx`: 画面遷移(view の状態機械)のみ。ロジックを書かない
- 関数型コンポーネント + Hooks のみ。1 ファイル 1 コンポーネント

## 守るべきルール(v1 の失敗の再発防止)

1. **フォールバックデータ禁止**: DB 接続失敗時はエラー画面 + 再試行。ハードコードのカテゴリ/テーマ/問題データを追加しない
2. **権限・制限判定はサーバー側**: is_premium / is_admin / 1 日制限はすべて RLS・RPC で担保。クライアント判定は表示の出し分けのみ
3. **隠しコマンド禁止**: ロゴ連打での管理者化のようなバックドアを追加しない
4. **キー管理**: anon key は `.env` のみ(公開前提キーなのでコミット可)。service_role キーは絶対にコミットしない
5. **コミット前に `npm run build && npm test` を通す**(CI でも強制される)

## ビジネスモデル

- 無料会員: 1 日 10 問 + 広告(広告は Phase 3 で実装)
- プレミアム会員: 無制限 + 広告なし + `is_premium` 問題(Stripe 連携は Phase 3。未実装の間はデモ有効化などを実装しない)

## 現在のフェーズ

Phase 1(MVP)実装済み: 認証(Google OAuth / Magic Link)・3 種の演習・回答履歴の DB 保存・統計表示・1 日 10 問制限

次の作業(`docs/requirements-v2.md` の Phase 2): 復習機能 → テーマ別正答率・弱点分析 → 管理画面 → 本番デプロイ(Vercel)
