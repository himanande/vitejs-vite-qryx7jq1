-- ============================================================
-- user_profiles テーブルの権限修正SQL
-- 作成日: 2026-07-27（2026-07-27 実カラム確認結果に基づき改訂）
-- 目的:
--   anonキーで user_profiles を直接検証したところ、
--   「permission denied for table user_profiles」(42501)というエラーが返り、
--   categories/themes/questions と違って GRANT 自体が欠けていることが判明した。
--   RLSポリシー云々の前に、テーブルへの基本権限が無い状態。
--   このままでは以下が機能しない可能性が高い:
--     - ログイン時のプロフィール読み込み/作成 (setupUserProfile)
--     - プレミアム状態の保存・反映 (handlePaymentSuccess / toggleUserPremium)
--     - 管理者ダッシュボードのユーザー一覧 (loadAdminStats)
--
--   さらに実カラム構成を確認したところ、App.tsx のコードが読み書きしようと
--   している `is_admin` 列がテーブルに存在しないことが判明した（下記実カラム参照）。
--   これは元の本SQLをそのまま実行すると
--   「column admin_row.is_admin does not exist」で失敗する原因でもあった。
--   このSQLでは STEP 0 として不足カラムを安全に追加してから進める。
--
--   実カラム(2026-07-27時点): id, display_name, avatar_url, provider,
--   is_premium, daily_question_count, total_questions_answered,
--   total_correct_answers, created_at （is_admin は無かった）
--
--   Supabase SQL Editor で実行すること。
-- ============================================================

-- STEP 0: App.tsx が前提としている is_admin 列が無いので追加（既存データは壊さない安全な追加のみ）
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- STEP 1: authenticated ロールに基本権限を付与
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- STEP 2: RLS ポリシーを作成（未作成の場合のみ。既にあればスキップしてよい）
-- 本人は自分の行だけ読み書きできる
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- STEP 3: 管理者は全員分を閲覧・更新できる
-- (is_admin フラグを持つ本人の行を経由して判定。無限再帰を避けるため EXISTS + サブクエリで自分の行のみ参照)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles admin_row
      WHERE admin_row.id = auth.uid() AND admin_row.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles admin_row
      WHERE admin_row.id = auth.uid() AND admin_row.is_admin = true
    )
  );

-- ============================================================
-- 確認クエリ（実行後、実際にログインしたセッションで確認すること）
-- ============================================================
-- 権限が正しく付与されたか確認:
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'user_profiles';

-- ポリシー一覧確認:
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';
