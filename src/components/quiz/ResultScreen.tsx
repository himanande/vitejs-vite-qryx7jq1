import './ResultScreen.css';
import {
  OPTION_LABELS,
  describeQuizTarget,
  optionsOf,
  summarize,
  type AnswerLog,
  type QuizConfig,
} from '../../lib/quizLogic';

interface Props {
  logs: AnswerLog[];
  config: QuizConfig;
  /** 演習中に本日の無料枠に達して打ち切られた場合 true */
  limitReached: boolean;
  onRetry: () => void;
  onHome: () => void;
}

export function ResultScreen({ logs, config, limitReached, onRetry, onHome }: Props) {
  const summary = summarize(logs);

  return (
    <div className="screen result-screen">
      <h1 className="result-title">演習結果</h1>
      <p className="result-target">{describeQuizTarget(config)}</p>

      <div className="card result-score">
        <span className="result-score-main">
          {summary.correctCount} / {summary.total} 問正解
        </span>
        <span className="result-score-accuracy">正答率 {summary.accuracy}%</span>
        {limitReached && (
          <span className="result-limit-note">
            ※ 本日の無料枠に達したため途中で終了しました
          </span>
        )}
      </div>

      <div className="result-actions">
        <button className="btn-primary" onClick={onRetry}>
          同じ条件でもう一度
        </button>
        <button className="btn-secondary" onClick={onHome}>
          ダッシュボードへ戻る
        </button>
      </div>

      {summary.wrong.length > 0 && (
        <section className="result-wrong-section">
          <h2 className="result-wrong-title">間違えた問題({summary.wrong.length}問)</h2>
          {summary.wrong.map((log) => (
            <div key={log.question.id} className="card result-wrong-item">
              <p className="result-wrong-question">{log.question.question_text}</p>
              <p className="result-wrong-answer">
                あなたの回答: {OPTION_LABELS[log.selected]}.{' '}
                {optionsOf(log.question)[log.selected]}
              </p>
              <p className="result-correct-answer">
                正解: {OPTION_LABELS[log.question.correct_answer]}.{' '}
                {optionsOf(log.question)[log.question.correct_answer]}
              </p>
              {log.question.explanation && (
                <p className="result-wrong-explanation">{log.question.explanation}</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
