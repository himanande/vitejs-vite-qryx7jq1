import './LimitModal.css';
import { FREE_DAILY_LIMIT } from '../../lib/constants';

interface Props {
  onClose: () => void;
}

/**
 * 無料会員の 1 日の回答上限に達したときの案内モーダル。
 * プレミアム登録導線は Stripe 連携(Phase 3)まで表示しない。
 */
export function LimitModal({ onClose }: Props) {
  return (
    <div className="limit-modal-overlay" role="dialog" aria-modal="true">
      <div className="card limit-modal">
        <h2>🕐 本日の無料枠が終了しました</h2>
        <p>
          無料会員は 1 日 {FREE_DAILY_LIMIT} 問まで回答できます。
          <br />
          明日また挑戦してください!
        </p>
        <p className="limit-modal-note">
          ※ 無制限で学習できるプレミアムプランは現在準備中です
        </p>
        <button className="btn-primary" onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}
