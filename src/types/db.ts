// Supabase の各テーブルに対応する型定義。
// スキーマは docs/system-overview.md および docs/migration_v2.sql を参照。

export interface Category {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Theme {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  /** fetchThemesWithCounts で付与される問題数(埋め込み集計) */
  question_count?: number;
}

/** correct_answer: 0=A, 1=B, 2=C, 3=D / difficulty_level: 1=基礎, 2=応用, 3=上級 */
export interface Question {
  id: number;
  category_id: number | null;
  theme_id: number | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
  explanation: string | null;
  difficulty_level: number;
  is_premium: boolean;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  is_premium: boolean;
  is_admin: boolean;
}

/** RPC get_my_stats の戻り値(docs/migration_v2.sql) */
export interface MyStats {
  total_answered: number;
  total_correct: number;
  today_answered: number;
  is_premium: boolean;
  remaining_today: number;
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '基礎',
  2: '応用',
  3: '上級',
};
