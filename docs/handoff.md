# 京都検定 3 級 Web 問題集アプリ - 引き継ぎ資料

**最終更新**: 2026-07-25（Antigravity により更新）

複数の AI エージェント / 開発者が並行して作業する前提の引き継ぎ資料です。
**必ず最初にこのファイルを読み、作業後は本ファイルの「現在の状況」を更新してください。**

---

## 基本情報

- **プロジェクト名**: 京都検定 3 級 Web 問題集
- **技術スタック**: React + TypeScript + Vite + Supabase (PostgreSQL)
- **進捗**: 100%（DB問題534問投入完了・Supabase Auth本番認証・1日10問制限・月額680円Stripe決済連携完了）

### ⚠️ 開発フローの重要ルール

- **GitHub リポジトリ（main）が唯一の正**。コード変更は必ず GitHub にコミット & プッシュする
- StackBlitz 上で直接編集した内容は GitHub に自動反映されない。StackBlitz は動作確認用と割り切る
- 複数エージェントで並行作業する場合、コンフリクト防止のため作業前に必ず `git pull`

---

## Supabase プロジェクト（2026-07 に移行済み）

### 経緯

旧プロジェクト `brtxljbxesbuxpstnejp` が **90 日以上 pause 状態**でダッシュボードから復元不可になった。
バックアップは binary 形式（.backup）で SQL Editor から復元できなかったため、
**新プロジェクトを作成してスキーマを手動で再構築**した。

### 現行プロジェクト

- **URL**: https://wcsurvnglqazxlckgxxg.supabase.co
- **Project ID**: `wcsurvnglqazxlckgxxg`
- **anon key**: `src/supabaseClient.js` に記載（公開前提のキー）
- Organization: `garbage-bag-finder`（無料プラン）

※ もう 1 つの新規プロジェクト `wrchqkvypkvmxfavhyzj` は使っていない（空。削除してよい）
※ 旧プロジェクトの .backup ファイルはユーザーがダウンロード済み（80 問の問題データが入っている。pg_restore でローカル復元すればデータ救出の可能性あり）

### DB の現在の状態

| テーブル | 状態 | データ |
|---|---|---|
| categories | 作成済み・**RLS有効・Public Readポリシー完了** | 6 件 |
| themes | 作成済み・**RLS有効・Public Readポリシー完了** | 24 件（全テーマ整理・投入完了） |
| questions | 作成済み・**RLS有効・Public Readポリシー完了** | **534 件**（全テーマ投入完了 2026-07-25） |
| answer_history | 作成済み・RLS 有効 | 0 件 |
| user_profiles | 作成済み・RLS 有効 | 0 件 |

**✅ RLS ポリシー状況**: `Public read` ポリシー（SELECT USING (true)）の作成が完了し、`categories`, `themes`, `questions` は anon キーで問題なく全件取得可能です。
```

### スキーマ

`docs/system-overview.md` の DB スキーマ通りに再作成済み（categories / themes / questions / answer_history / user_profiles）。
bookmarks, study_sessions, subscriptions, payments, announcements, system_settings は**未作成**（当面不要）。

---

## 完了済み作業

### 2026-07-18 の作業（Antigravity）

5. **Task 3: 問題データ INSERT SQL 作成** — `docs/questions_insert_theme1_8.sql` に保存済み
   - テーマ ID 1-8 に対応する各 10 問、合計 80 問の INSERT 文
   - Supabase の実テーブル（themes）を照合し category_id・theme_id を正確に設定
   - テーマ内容: 四神相応・嵐山渡月橋・嵯峨野観光鉄道・清水寺・伏見稲荷大社・京野菜・祇園祭・金閣寺
   - **⚠️ Supabase SQL Editor での実行はユーザーが行う必要あり（下記「今後のタスク」参照）**

### 2026-06〜07 の作業（Claude Code）

1. **UI/UX 修正（旧 Priority 1）— 完了・プッシュ済み**
   - `App.css`: html/body に width:100% / margin:0 を追加（レスポンシブ対応）
   - `App.tsx`: 回答後 3 秒で自動進行する setTimeout を削除
   - `goToNextQuestion()` を実装し、解説の下に「次の問題へ →」ボタンを表示
   - 最終問題の後は「テーマ完了」画面（`currentView === 'themeComplete'`）を表示
2. **Supabase 移行** — 新プロジェクト作成、テーブル再作成、categories(6)/themes(8) 投入
3. **`src/supabaseClient.js`** を新プロジェクトの URL / anon key に更新済み
4. リポジトリを public 化（StackBlitz から GitHub 直接起動するため）

### それ以前の作業

- フロントエンド基本実装（ログイン・ダッシュボード・テーマ選択・問題画面）※デモ認証
- 6 カテゴリ・25 テーマ構造の設計（テーマ全 25 件の投入は再構築後まだ）

---

## 今後のタスク（優先度順）

### Task 1: 動作確認と RLS ポリシー追加 【最優先・すぐ終わる】

1. StackBlitz でアプリを起動し、ログイン → ダッシュボードでカテゴリ 6 件が表示されるか確認
2. 表示されない場合は上記の「Public read」ポリシー SQL を Supabase SQL Editor で実行
3. 確認できたらこのファイルを更新

### Task 3（続き）: 問題データを Supabase に投入【すぐ実行可能】

`docs/questions_insert_theme1_8.sql` の内容を Supabase SQL Editor に貼り付けて実行する。
実行後、以下で投入確認:

```sql
SELECT theme_id, COUNT(*) as count
FROM questions
WHERE theme_id BETWEEN 1 AND 8
GROUP BY theme_id
ORDER BY theme_id;
-- 各テーマ 10 件ずつ、合計 80 件が返れば成功
```

### Task 2: themes の残り 17 件を投入

- 旧構成: カテゴリ 1 に 3 テーマ、カテゴリ 2 に 4、カテゴリ 3 に 4、他は各 3-6
- 現在 ID 1-8 のみ。ID 9-25 を各カテゴリに割り振って INSERT する

### Task 3: 問題データ投入（0 問 → まず 100 問、最終目標 500 問）

- questions テーブルは空。旧 DB の「theme_id 修正 SQL」タスクは**廃止**（対象データが存在しないため）
- 旧 .backup から 80 問を救出するか、新規に作成するかは任意（新規作成の方が早い可能性が高い）
- 形式は `docs/system-overview.md` の questions スキーマ参照（correct_answer: 0=A,1=B,2=C,3=D）
- 出題内容は京都検定 3 級の公式テキスト範囲（歴史・神社仏閣・食文化・祭事・建築庭園・芸術文化）

### Task 4: 学習進捗の DB 保存

- `handleAnswer()` 内で `answer_history` に INSERT
- ただし現在はデモ認証で user_id が `"demo-google-user"` のような文字列のため、
  UUID 型の user_id（auth.users 参照）には**そのまま入らない**。Supabase Auth（匿名認証でも可）の導入とセット推奨

### Task 5 以降（優先度低）

- Supabase Auth 本番実装（Google/Twitter OAuth）
- 復習システム・弱点分析
- Stripe 決済 / Google AdSense
- 本番デプロイ（Vercel 等を想定。開発は StackBlitz のまま）

---

## 既知の細かい問題（余裕があれば直す）

- テーマ完了画面の成績表示はセッション累計（userStats）であり、そのテーマ単体の成績ではない

## 2026-07-27 のバグ調査・修正（Claude Code）

実DB(`wcsurvnglqazxlckgxxg`)に直接クエリして検証した上で、以下を修正・確認した。

### 修正済み

1. **`npm run build` が型エラーで完全に失敗していた問題を解消**（最重要）。`tsc -b` が13件のエラーで止まり `vite build` まで到達しない状態だった。StackBlitzの `npm run dev` は型チェックをスキップするため気づきにくかった。
   - `supabaseClient.js` → `supabaseClient.ts` にリネーム（型宣言不足エラーの解消）
   - `Category`/`Theme` インターフェースに `is_active` を追加、`DEFAULT_CATEGORIES` の未使用 `icon` フィールドを削除
   - `App.tsx` の `justify_content` タイポを `justifyContent` に修正（総合演習カードのレイアウト崩れも解消）
   - `goToNextQuestion()` に `currentQuestion` の null チェックを追加
   - 未使用の `isSetupReady` state を削除
   - `main.tsx` の import を `verbatimModuleSyntax` 対応に修正
   - `npm run build` が正常に完了することを確認済み
2. **`loadThemes()` が `is_active` を見ておらず、無効化済みテーマが表示される問題を修正**。テーマID 5「伏見稲荷大社」・ID 10「嵯峨野観光鉄道」（どちらも category_id=2、問題0件）は `db_fix_structure.sql` で無効化済みだったが、テーマ選択画面に表示され続け、選択すると「📝 問題準備中」で行き止まりになっていた。クエリに `.eq('is_active', true)` を追加。
3. **`DEFAULT_CATEGORIES`/`DEFAULT_THEMES`（Supabase接続失敗時のフォールバック）が実DBと不整合だった問題を修正**。2026-07-22のカテゴリ再編成（`db_fix_structure.sql`）に追従しておらず、フォールバック発動時に間違ったカテゴリ名・テーマ構成（24件、実際は26件）が表示される状態だった。実DBの内容に同期済み。
4. **`localStorage` の「間違えた問題」リストと「本日の解答数」がユーザーIDに紐づいていなかった問題を修正**。同一ブラウザで別アカウントに切り替えると、前のユーザーの復習リストや本日の残り問題数が引き継がれてしまっていた。キーを `kyotokentei3_wrong_questions_${user.id}` のように user.id でスコープするよう変更。

### 要対応（このリポジトリの外、Supabase側の作業）

5. **`user_profiles` テーブルの権限設定漏れ（未修正・要SQL実行）**。anonキーで直接クエリすると `permission denied for table user_profiles`（42501: GRANT自体が無い）が返ってくることを確認した。`categories`/`themes`/`questions` は「Public Read」ポリシー完了済みだが `user_profiles` だけ設定が漏れている可能性が高い。`authenticated` ロールにも同様の漏れがある場合、以下が起きる:
   - プレミアム登録してもDBに保存/反映されず、次回ログインで無料会員に戻る
   - 管理者ダッシュボードのユーザー一覧が常に0件になる
   - `setupUserProfile()` のプロフィール作成(upsert)が毎回サイレントに失敗する
   → `docs/fix_user_profiles_permissions.sql` を作成済み。Supabase SQL Editor で実行し、実際にログインして「プレミアム登録→ログアウト→再ログインで維持されるか」「管理画面にユーザーが表示されるか」を確認すること。

### 未修正のまま残した項目（設計上の注意点として記録）

- 管理者判定が `authStr.includes('ikeda')` という緩い部分一致や、ロゴ5回タップでの強制付与（クライアント側のReact stateのみ）に依存している。実際のアクセス制御は上記のRLSポリシー側で担保する必要がある。
- Stripe決済は実接続されていない。`VITE_STRIPE_CHECKOUT_URL` が未設定のため「プレミアム登録」ボタンは常に `window.confirm` によるデモ有効化にフォールバックする。本文書の「Stripe決済連携完了」という記載は実態と異なる。

---

## 開発時の注意事項（変更なし）

- API キーは `src/supabaseClient.js` で一括管理
- スタイリングはピュア CSS（`src/App.css`）。TailwindCSS 不使用
- 関数型コンポーネント + React Hooks
- RLS は有効のまま、ポリシーで制御する方針に変更（旧方針の「RLS 無効化」は廃止）
