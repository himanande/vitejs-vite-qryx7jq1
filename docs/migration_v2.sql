-- ============================================================
-- v2 再構築 Phase 1 マイグレーション SQL
-- 作成日: 2026-08-08
-- 実行方法: Supabase SQL Editor (プロジェクト wcsurvnglqazxlckgxxg) に
--           全文貼り付けて一度実行する。冪等に書いてあるので再実行しても安全。
--
-- 含まれる内容:
--   STEP 1: user_profiles の権限・カラム修正(旧 fix_user_profiles_permissions.sql を統合)
--   STEP 2: 新規ユーザー登録時のプロフィール自動作成トリガー
--   STEP 3: answer_history の権限・RLS(本人のみ読み書き + 1日10問制限をDB側で強制)
--   STEP 4: 統計取得 RPC (get_my_stats)
-- ============================================================

-- ============================================================
-- STEP 1: user_profiles のカラム・権限・RLS
-- ============================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 本人は自分の行だけ読み書きできる
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 本人の UPDATE は許可するが、is_premium / is_admin をクライアントから
-- 書き換えられないようトリガーで防御する(RLS の WITH CHECK では列単位の制御が
-- できないため)
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role や postgres からの実行(Stripe Webhook 等)は制限しない
  IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
    NEW.is_premium := OLD.is_premium;
    NEW.is_admin   := OLD.is_admin;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_privileged_columns ON public.user_profiles;
CREATE TRIGGER protect_privileged_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_profile_columns();

-- ============================================================
-- STEP 2: 新規ユーザー登録時に user_profiles を自動作成
-- (v1 のクライアント側 upsert 方式を廃止し、DB トリガーに一本化)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 既存ユーザー(トリガー作成前に登録済み)のプロフィールを補完
INSERT INTO public.user_profiles (id, display_name, provider)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(COALESCE(u.email, ''), '@', 1)
  ),
  COALESCE(u.raw_app_meta_data->>'provider', 'email')
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ============================================================
-- STEP 3: answer_history の権限・RLS
--   - 本人のみ SELECT / INSERT
--   - INSERT は「プレミアム会員 または 本日(JST)10問未満」の場合のみ許可
--     → 1日10問制限を DB 側で強制(localStorage 方式の廃止)
-- ============================================================
GRANT SELECT, INSERT ON public.answer_history TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER TABLE public.answer_history ENABLE ROW LEVEL SECURITY;

-- 本日(日本時間)の 0:00 を UTC timestamptz で返すヘルパー
CREATE OR REPLACE FUNCTION public.jst_today_start()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT date_trunc('day', now() AT TIME ZONE 'Asia/Tokyo') AT TIME ZONE 'Asia/Tokyo'
$$;

-- 無料会員の1日上限。変更する場合はこの関数だけ直せばよい
CREATE OR REPLACE FUNCTION public.free_daily_limit()
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 10 $$;

CREATE OR REPLACE FUNCTION public.can_answer_now()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT is_premium FROM user_profiles WHERE id = auth.uid()), false)
    OR (
      SELECT count(*) FROM answer_history
      WHERE user_id = auth.uid()
        AND answered_at >= public.jst_today_start()
    ) < public.free_daily_limit()
$$;

DROP POLICY IF EXISTS "Users can view own answers" ON public.answer_history;
CREATE POLICY "Users can view own answers"
  ON public.answer_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own answers within limit" ON public.answer_history;
CREATE POLICY "Users can insert own answers within limit"
  ON public.answer_history FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.can_answer_now());

-- ============================================================
-- STEP 4: ダッシュボード統計 RPC
--   クライアントは1回の RPC で 累計回答数 / 累計正答数 / 本日回答数 /
--   プレミアム状態 / 本日の残り問題数 を取得する
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_stats()
RETURNS TABLE (
  total_answered  bigint,
  total_correct   bigint,
  today_answered  bigint,
  is_premium      boolean,
  remaining_today integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      count(*)                                                    AS total_answered,
      count(*) FILTER (WHERE is_correct)                          AS total_correct,
      count(*) FILTER (WHERE answered_at >= public.jst_today_start()) AS today_answered
    FROM answer_history
    WHERE user_id = auth.uid()
  ),
  prof AS (
    SELECT COALESCE(
      (SELECT p.is_premium FROM user_profiles p WHERE p.id = auth.uid()),
      false
    ) AS is_premium
  )
  SELECT
    agg.total_answered,
    agg.total_correct,
    agg.today_answered,
    prof.is_premium,
    CASE
      WHEN prof.is_premium THEN 2147483647
      ELSE greatest(public.free_daily_limit() - agg.today_answered::integer, 0)
    END AS remaining_today
  FROM agg, prof
$$;

GRANT EXECUTE ON FUNCTION public.get_my_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_answer_now() TO authenticated;

-- ============================================================
-- (任意) 管理者フラグの付与。Phase 2 の管理画面で使用。
-- 実行する場合はコメントを外すこと。
-- ============================================================
-- UPDATE public.user_profiles SET is_admin = true
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'ikeda3.note@gmail.com');

-- ============================================================
-- 確認クエリ
-- ============================================================
-- 1) ポリシー一覧:
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE tablename IN ('user_profiles', 'answer_history') ORDER BY tablename;
-- 2) 関数の動作(ログイン済みセッションでアプリから確認するのが確実):
--   SELECT * FROM public.get_my_stats();
