import { describe, expect, it } from 'vitest';
import type { Question } from '../types/db';
import {
  buildQuizSet,
  describeQuizTarget,
  effectiveQuizLength,
  isCorrectAnswer,
  optionsOf,
  shuffle,
  summarize,
  type AnswerLog,
} from './quizLogic';

function makeQuestion(id: number, overrides: Partial<Question> = {}): Question {
  return {
    id,
    category_id: 1,
    theme_id: 1,
    question_text: `問題${id}`,
    option_a: 'A案',
    option_b: 'B案',
    option_c: 'C案',
    option_d: 'D案',
    correct_answer: 0,
    explanation: null,
    difficulty_level: 1,
    is_premium: false,
    is_active: true,
    ...overrides,
  };
}

describe('shuffle', () => {
  it('元配列を変更せず、同じ要素を保つ', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    const result = shuffle(original);
    expect(original).toEqual(copy);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('random 関数で並びを制御できる(決定的テスト)', () => {
    const result = shuffle([1, 2, 3], () => 0);
    expect(result).toHaveLength(3);
    expect(new Set(result)).toEqual(new Set([1, 2, 3]));
  });
});

describe('isCorrectAnswer', () => {
  const q = makeQuestion(1, { correct_answer: 2 });

  it('正解の選択肢で true', () => {
    expect(isCorrectAnswer(q, 2)).toBe(true);
  });

  it('不正解の選択肢で false', () => {
    expect(isCorrectAnswer(q, 0)).toBe(false);
    expect(isCorrectAnswer(q, 3)).toBe(false);
  });
});

describe('effectiveQuizLength', () => {
  it('指定数・在庫・残り回数の最小値になる', () => {
    expect(effectiveQuizLength(10, 50, 100)).toBe(10);
    expect(effectiveQuizLength(10, 4, 100)).toBe(4);
    expect(effectiveQuizLength(10, 50, 3)).toBe(3);
  });

  it('0(全問指定)は在庫全部を意味する', () => {
    expect(effectiveQuizLength(0, 25, 100)).toBe(25);
    expect(effectiveQuizLength(0, 25, 5)).toBe(5);
  });

  it('残り 0 のときは 0 問(負にならない)', () => {
    expect(effectiveQuizLength(10, 50, 0)).toBe(0);
    expect(effectiveQuizLength(10, 50, -1)).toBe(0);
  });
});

describe('buildQuizSet', () => {
  const pool = [1, 2, 3, 4, 5].map((id) => makeQuestion(id));

  it('指定した問題数だけ返す', () => {
    expect(buildQuizSet(pool, 3)).toHaveLength(3);
  });

  it('重複しない', () => {
    const set = buildQuizSet(pool, 5);
    expect(new Set(set.map((q) => q.id)).size).toBe(5);
  });
});

describe('summarize', () => {
  it('正答数・正答率・間違いリストを集計する', () => {
    const logs: AnswerLog[] = [
      { question: makeQuestion(1), selected: 0, correct: true },
      { question: makeQuestion(2), selected: 1, correct: false },
      { question: makeQuestion(3), selected: 0, correct: true },
    ];
    const s = summarize(logs);
    expect(s.total).toBe(3);
    expect(s.correctCount).toBe(2);
    expect(s.accuracy).toBe(67);
    expect(s.wrong.map((l) => l.question.id)).toEqual([2]);
  });

  it('回答 0 件でも安全(0 除算にならない)', () => {
    const s = summarize([]);
    expect(s.total).toBe(0);
    expect(s.accuracy).toBe(0);
    expect(s.wrong).toEqual([]);
  });
});

describe('optionsOf', () => {
  it('A〜D を配列で返す(correct_answer のインデックスと対応)', () => {
    const q = makeQuestion(1, { correct_answer: 3 });
    expect(optionsOf(q)).toEqual(['A案', 'B案', 'C案', 'D案']);
    expect(optionsOf(q)[q.correct_answer]).toBe('D案');
  });
});

describe('describeQuizTarget', () => {
  it('テーマ演習はテーマ名', () => {
    expect(
      describeQuizTarget({ mode: 'theme', themeId: 1, themeName: '祇園祭', count: 10, difficulty: 0 })
    ).toBe('祇園祭');
  });

  it('カテゴリ演習はカテゴリ名の連結', () => {
    expect(
      describeQuizTarget({
        mode: 'category',
        categoryIds: [1, 2],
        categoryNames: ['歴史・史跡', '神社・寺院'],
        count: 10,
        difficulty: 0,
      })
    ).toBe('歴史・史跡・神社・寺院');
  });

  it('総合演習は固定ラベル', () => {
    expect(describeQuizTarget({ mode: 'all', count: 10, difficulty: 0 })).toBe(
      '総合演習(全問題から出題)'
    );
  });
});
