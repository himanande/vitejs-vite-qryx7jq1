// Supabase へのデータアクセスを一箇所に集約する。
// 権限・回答数制限の実体は DB 側(RLS / RPC。docs/migration_v2.sql)にあり、
// ここでは取得と保存のみを行う。

import { supabase } from './supabaseClient';
import type { Category, MyStats, Question, Theme, UserProfile } from '../types/db';
import type { QuizConfig } from './quizLogic';

/** RLS(1日制限)違反時に PostgREST が返すエラーコード */
const RLS_VIOLATION = '42501';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) throw new Error(`カテゴリの取得に失敗しました: ${error.message}`);
  return data ?? [];
}

/** テーマ一覧を問題数つきで取得する。問題数 0 のテーマは出題できないため除外 */
export async function fetchThemesWithCounts(categoryId: number): Promise<Theme[]> {
  const { data, error } = await supabase
    .from('themes')
    .select('*, questions(count)')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('display_order');
  if (error) throw new Error(`テーマの取得に失敗しました: ${error.message}`);
  return (data ?? [])
    .map((row) => {
      const { questions, ...theme } = row as Theme & { questions: { count: number }[] };
      return { ...theme, question_count: questions?.[0]?.count ?? 0 };
    })
    .filter((t) => (t.question_count ?? 0) > 0);
}

/** 演習条件に合致する問題を全件取得する(選択・シャッフルは quizLogic 側で行う) */
export async function fetchQuestions(
  config: QuizConfig,
  isPremiumUser: boolean
): Promise<Question[]> {
  let query = supabase.from('questions').select('*').eq('is_active', true);

  if (config.mode === 'theme' && config.themeId != null) {
    query = query.eq('theme_id', config.themeId);
  } else if (config.mode === 'category' && config.categoryIds?.length) {
    query = query.in('category_id', config.categoryIds);
  }
  if (config.difficulty > 0) {
    query = query.eq('difficulty_level', config.difficulty);
  }
  if (!isPremiumUser) {
    query = query.eq('is_premium', false);
  }

  const { data, error } = await query;
  if (error) throw new Error(`問題の取得に失敗しました: ${error.message}`);
  return data ?? [];
}

export async function fetchMyStats(): Promise<MyStats> {
  const { data, error } = await supabase.rpc('get_my_stats').single();
  if (error) throw new Error(`学習状況の取得に失敗しました: ${error.message}`);
  return data as MyStats;
}

export async function fetchMyProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`プロフィールの取得に失敗しました: ${error.message}`);
  return data;
}

/**
 * プロフィールが無い場合に作成する(通常は DB トリガーが作成するため、
 * トリガー導入前に登録された既存ユーザーの救済用)。
 */
export async function ensureMyProfile(
  userId: string,
  displayName: string | null
): Promise<UserProfile | null> {
  const existing = await fetchMyProfile(userId);
  if (existing) return existing;
  const { error } = await supabase
    .from('user_profiles')
    .insert({ id: userId, display_name: displayName });
  if (error && error.code !== '23505') {
    throw new Error(`プロフィールの作成に失敗しました: ${error.message}`);
  }
  return fetchMyProfile(userId);
}

export interface SaveAnswerResult {
  saved: boolean;
  /** DB 側の 1 日制限(RLS)に弾かれた場合 true */
  limitReached: boolean;
}

export async function saveAnswer(
  userId: string,
  questionId: number,
  selected: number,
  isCorrect: boolean
): Promise<SaveAnswerResult> {
  const { error } = await supabase.from('answer_history').insert({
    user_id: userId,
    question_id: questionId,
    selected_answer: selected,
    is_correct: isCorrect,
  });
  if (!error) return { saved: true, limitReached: false };
  if (error.code === RLS_VIOLATION) return { saved: false, limitReached: true };
  throw new Error(`回答の保存に失敗しました: ${error.message}`);
}
