import { useCallback, useEffect, useMemo, useState } from 'react';
import './QuizSetup.css';
import type { MyStats, Question } from '../../types/db';
import { DIFFICULTY_LABELS } from '../../types/db';
import { fetchMyStats, fetchQuestions } from '../../lib/quizApi';
import {
  buildQuizSet,
  describeQuizTarget,
  effectiveQuizLength,
  type QuizConfig,
} from '../../lib/quizLogic';
import { QUESTION_COUNT_OPTIONS } from '../../lib/constants';
import { LoadingScreen } from '../common/LoadingScreen';
import { ErrorScreen } from '../common/ErrorScreen';
import { LimitModal } from '../common/LimitModal';

interface Props {
  /** mode と出題対象(テーマ/カテゴリ)が設定済みの条件。count/difficulty はここで選ぶ */
  baseConfig: QuizConfig;
  onStart: (questions: Question[], config: QuizConfig) => void;
  onBack: () => void;
}

export function QuizSetup({ baseConfig, onStart, onBack }: Props) {
  const [pool, setPool] = useState<Question[] | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(baseConfig.count || 10);
  const [difficulty, setDifficulty] = useState<number>(baseConfig.difficulty || 0);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const myStats = await fetchMyStats();
      // 難易度は画面上で切り替えるため、まず難易度指定なしで全件取得する
      const questions = await fetchQuestions(
        { ...baseConfig, difficulty: 0 },
        myStats.is_premium
      );
      setStats(myStats);
      setPool(questions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [baseConfig]);

  useEffect(() => {
    void load();
  }, [load]);

  const countsByLevel = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const q of pool ?? []) {
      counts[q.difficulty_level] = (counts[q.difficulty_level] ?? 0) + 1;
    }
    return counts;
  }, [pool]);

  if (error) return <ErrorScreen message={error} onRetry={() => void load()} onBack={onBack} />;
  if (!pool || !stats) return <LoadingScreen />;

  const filtered = difficulty > 0 ? pool.filter((q) => q.difficulty_level === difficulty) : pool;
  const quizLength = effectiveQuizLength(count, filtered.length, stats.remaining_today);
  const cappedByLimit =
    !stats.is_premium &&
    quizLength < Math.min(count || filtered.length, filtered.length);

  const handleStart = () => {
    if (stats.remaining_today <= 0) {
      setShowLimitModal(true);
      return;
    }
    if (quizLength <= 0) return;
    const config: QuizConfig = { ...baseConfig, count, difficulty };
    onStart(buildQuizSet(filtered, quizLength), config);
  };

  return (
    <div className="screen quiz-setup">
      <button className="btn-text quiz-setup-back" onClick={onBack}>
        ← 戻る
      </button>
      <h1 className="quiz-setup-title">演習条件の設定</h1>
      <p className="quiz-setup-target">{describeQuizTarget(baseConfig)}</p>

      <div className="card quiz-setup-form">
        <div className="quiz-setup-field">
          <span className="quiz-setup-label">難易度</span>
          <div className="quiz-setup-options">
            <button
              className={`quiz-setup-option ${difficulty === 0 ? 'is-selected' : ''}`}
              onClick={() => setDifficulty(0)}
            >
              すべて({pool.length}問)
            </button>
            {[1, 2, 3].map((level) => (
              <button
                key={level}
                className={`quiz-setup-option ${difficulty === level ? 'is-selected' : ''}`}
                disabled={countsByLevel[level] === 0}
                onClick={() => setDifficulty(level)}
              >
                {DIFFICULTY_LABELS[level]}({countsByLevel[level]}問)
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-setup-field">
          <span className="quiz-setup-label">出題数</span>
          <div className="quiz-setup-options">
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                className={`quiz-setup-option ${count === n ? 'is-selected' : ''}`}
                onClick={() => setCount(n)}
              >
                {n === 0 ? `全問(${filtered.length})` : `${n}問`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="quiz-setup-warning">この条件に合致する問題がありません。</p>
        ) : (
          <p className="quiz-setup-summary">
            この条件で <strong>{quizLength}問</strong> 出題します
            {cappedByLimit && (
              <span className="quiz-setup-warning">
                (本日の残り回答数 {stats.remaining_today} 問に合わせて調整)
              </span>
            )}
          </p>
        )}

        <button className="btn-primary" disabled={quizLength <= 0 && stats.remaining_today > 0} onClick={handleStart}>
          演習をスタート
        </button>
      </div>

      {showLimitModal && <LimitModal onClose={() => setShowLimitModal(false)} />}
    </div>
  );
}
