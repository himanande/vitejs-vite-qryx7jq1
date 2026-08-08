import { useState } from 'react';
import './LoginScreen.css';

interface Props {
  onGoogleLogin: () => Promise<void>;
  onMagicLinkLogin: (email: string) => Promise<boolean>;
  authError: string | null;
}

export function LoginScreen({ onGoogleLogin, onMagicLinkLogin, authError }: Props) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    const ok = await onMagicLinkLogin(email.trim());
    setSending(false);
    if (ok) setMagicLinkSent(true);
  };

  return (
    <div className="login-screen">
      <div className="card login-card">
        <div className="login-logo" aria-hidden="true">
          🏯
        </div>
        <h1 className="login-title">京都検定 3 級 問題集</h1>
        <p className="login-subtitle">
          全 500 問超の演習問題で
          <br />
          京都検定 3 級合格を目指そう
        </p>

        {authError && <p className="login-error">{authError}</p>}

        {magicLinkSent ? (
          <div className="login-sent">
            <p>
              📧 <strong>{email}</strong> 宛にログイン用リンクを送信しました。
            </p>
            <p className="login-sent-note">
              メール内のリンクを開くとログインが完了します。
            </p>
            <button className="btn-text" onClick={() => setMagicLinkSent(false)}>
              別の方法でログインする
            </button>
          </div>
        ) : (
          <>
            <button className="btn-primary login-google" onClick={() => void onGoogleLogin()}>
              Google でログイン
            </button>

            <div className="login-divider">または</div>

            <form className="login-email-form" onSubmit={handleEmailSubmit}>
              <input
                type="email"
                required
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <button className="btn-secondary" type="submit" disabled={sending}>
                {sending ? '送信中…' : 'ログインリンクを送信'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
