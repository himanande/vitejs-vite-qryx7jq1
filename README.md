# 京都検定 3 級 Web 問題集アプリ

京都検定 3 級の合格を目指すユーザー向けのフリーミアム Web 問題集アプリです。
全 534 問(6 カテゴリ × 24 テーマ)の演習問題を収録しています。

要件・設計は **[docs/requirements-v2.md](docs/requirements-v2.md)** を参照してください。

## 技術スタック

- React 19 + TypeScript + Vite
- Supabase(PostgreSQL / Auth / RLS)
- ピュア CSS(TailwindCSS 不使用)
- Vitest + React Testing Library

## セットアップ

```bash
npm install
npm run dev
```

Supabase の接続情報は `.env` で管理しています(anon key は公開前提のキーのため
リポジトリに含めています。service_role キーは絶対にコミットしないこと)。

### DB マイグレーション

初回セットアップ時、および `docs/migration_v2.sql` が更新された場合は、
Supabase SQL Editor で同ファイルを実行してください(冪等なので再実行可)。
認証・回答履歴・1 日 10 問制限はこの SQL が前提です。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック + 本番ビルド |
| `npm test` | テスト実行(単発) |
| `npm run test:watch` | テスト実行(watch) |
| `npm run lint` | ESLint |

push / PR ごとに GitHub Actions(`.github/workflows/ci.yml`)で build + test が走ります。

## ディレクトリ構成

```
src/
├── components/     # 画面・UI 部品(1 ファイル 1 コンポーネント + 同名 .css)
│   ├── auth/       # LoginScreen
│   ├── common/     # LoadingScreen, ErrorScreen, LimitModal
│   ├── dashboard/  # Dashboard
│   └── quiz/       # ThemeSelector, QuizSetup, QuestionScreen, ResultScreen
├── hooks/          # useAuth
├── lib/            # supabaseClient, quizApi(DB アクセス), quizLogic(純粋ロジック), constants
├── types/          # DB 型定義
├── App.tsx         # 画面遷移(view の状態機械)のみ
└── main.tsx        # エントリーポイント + ErrorBoundary
```
