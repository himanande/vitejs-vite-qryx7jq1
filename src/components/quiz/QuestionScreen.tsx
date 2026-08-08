import { useState } from 'react';
import './QuestionScreen.css';
import type { Question } from '../../types/db';
import { DIFFICULTY_LABELS } from '../../types/db';
import { saveAnswer } from '../../lib/quizApi';
import {
  OPTION_LABELS,
  isCorrectAnswer,
  optionsOf,
  type AnswerLog,
} from '../../lib/quizLogic';

interface Props {
  questions: Question[];
  userId: string;
  onFinish: (logs: AnswerLog[], limitReached: boolean) => void;
  onAbort: () => void;
}

export function QuestionScreen({ questions, userId, onFinish, onAbort }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [logs, setLogs] = useState<AnswerLog[]>([]);
  const [limitReached, setLimitReached] = useState(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answered = selected !== null;

  const handleSelect = (option: number) => {
    if (answered) return;
    const correct = isCorrectAnswer(question, option);
    setSelected(option);
    setLogs((prev) => [...prev, { question, selected: option, correct }]);

    // 保存は待たずに進められるようにする。DB 側の1日制限に弾かれた場合のみ
    // フラグを立て、この問題を最後に演習を終了する
    saveAnswer(userId, question.id, option, correct)
      .then((result) => {
        if (result.limitReached) setLimitReached(true);
      })
      .catch((e) => console.error('回答の保存に失敗:', e));
  };

  const handleNext = () => {
    if (isLast || limitReached) {
      onFinish(logs, limitReached);
      return;
    }
    setSelected(null);
    setIndex((i) => i + 1);
  };

  const handleAbort = () => {
    if (window.confirm('演習を中断してダッシュボードに戻りますか?\n(回答済みの問題は記録されています)')) {
      onAbort();
    }
  };

  const currentLog = logs[logs.length - 1];

  return (
    <div className="screen question-screen">
      <div className="question-header">
        <span className="question-progress-text">
          {index + 1} / {questions.length} 問
        </span>
        <button className="btn-text" onClick={handleAbort}>
          中断する
        </button>
      </div>
      <div className="question-progress-bar">
        <div
          className="question-progress-fill"
          style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="card question-card">
        <span className="question-difficulty">
          {DIFFICULTY_LABELS[question.difficulty_level] ?? ''}
        </span>
        <h2 className="question-text">{question.question_text}</h2>

        <div className="question-options">
          {optionsOf(question).map((text, i) => {
            let stateClass = '';
            if (answered) {
              if (i === question.correct_answer) stateClass = 'is-correct';
              else if (i === selected) stateClass = 'is-wrong';
              else stateClass = 'is-disabled';
            }
            return (
              <button
                key={i}
                className={`question-option ${stateClass}`}
                onClick={() => handleSelect(i)}
                disabled={answered}
              >
                <span className="question-option-label">{OPTION_LABELS[i]}</span>
                <span>{text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {answered && currentLog && (
        <div
          className={`card question-feedback ${currentLog.correct ? 'is-correct' : 'is-wrong'}`}
        >
          <p className="question-feedback-result">
            {currentLog.correct
              ? '⭕ 正解!'
              : `❌ 不正解… 正解は ${OPTION_LABELS[question.correct_answer]} です`}
          </p>
          {question.explanation && (
            <p className="question-feedback-explanation">{question.explanation}</p>
          )}
          {limitReached && (
            <p className="question-feedback-limit">
              本日の無料枠に達したため、この問題で演習を終了します。
            </p>
          )}
          <button className="btn-primary" onClick={handleNext}>
            {isLast || limitReached ? '結果を見る' : '次の問題へ →'}
          </button>
        </div>
      )}
    </div>
  );
}
