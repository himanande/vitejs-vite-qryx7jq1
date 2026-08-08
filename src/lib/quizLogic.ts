// 演習の純粋ロジック。Supabase に依存しないため単体テスト可能(quizLogic.test.ts)。

import type { Question } from '../types/db';

export type QuizMode = 'theme' | 'category' | 'all';

/** 演習条件。count: 0 は「全問」、difficulty: 0 は「すべて」 */
export interface QuizConfig {
  mode: QuizMode;
  themeId?: number;
  themeName?: string;
  categoryIds?: number[];
  categoryNames?: string[];
  count: number;
  difficulty: number;
}

export interface AnswerLog {
  question: Question;
  selected: number;
  correct: boolean;
}

export interface QuizSummary {
  total: number;
  correctCount: number;
  /** 0-100 の整数(%)。total 0 のときは 0 */
  accuracy: number;
  wrong: AnswerLog[];
}

export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export function optionsOf(q: Question): string[] {
  return [q.option_a, q.option_b, q.option_c, q.option_d];
}

/** Fisher–Yates。元配列は変更しない */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function isCorrectAnswer(question: Question, selected: number): boolean {
  return question.correct_answer === selected;
}

/**
 * 実際に出題する問題数を決める。
 * requested: ユーザー指定の出題数(0 = 全問)
 * available: 条件に合致した問題の総数
 * remainingToday: 本日の残り回答可能数(プレミアムは実質無制限の大きい値)
 */
export function effectiveQuizLength(
  requested: number,
  available: number,
  remainingToday: number
): number {
  const wanted = requested <= 0 ? available : Math.min(requested, available);
  return Math.max(Math.min(wanted, remainingToday), 0);
}

/** 条件に合致した問題からシャッフルして count 問を選ぶ */
export function buildQuizSet(
  questions: readonly Question[],
  count: number,
  random: () => number = Math.random
): Question[] {
  return shuffle(questions, random).slice(0, count);
}

export function summarize(logs: readonly AnswerLog[]): QuizSummary {
  const total = logs.length;
  const correctCount = logs.filter((l) => l.correct).length;
  return {
    total,
    correctCount,
    accuracy: total === 0 ? 0 : Math.round((correctCount / total) * 100),
    wrong: logs.filter((l) => !l.correct),
  };
}

/** 演習条件の表示用ラベル */
export function describeQuizTarget(config: QuizConfig): string {
  switch (config.mode) {
    case 'theme':
      return config.themeName ?? 'テーマ別演習';
    case 'category':
      return (config.categoryNames ?? []).join('・') || 'カテゴリ別演習';
    case 'all':
      return '総合演習(全問題から出題)';
  }
}
