import './ErrorScreen.css';

interface Props {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

/**
 * データ取得失敗時の画面。
 * v1 のようなフォールバックデータは表示せず、エラーと再試行のみを提供する。
 */
export function ErrorScreen({ message, onRetry, onBack }: Props) {
  return (
    <div className="error-screen">
      <div className="card error-card">
        <h2>⚠️ エラーが発生しました</h2>
        <p className="error-message">{message}</p>
        {onRetry && (
          <button className="btn-primary" onClick={onRetry}>
            再試行する
          </button>
        )}
        {onBack && (
          <button className="btn-text" onClick={onBack}>
            ← 戻る
          </button>
        )}
      </div>
    </div>
  );
}
