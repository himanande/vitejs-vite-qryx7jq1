import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';

afterEach(cleanup);

describe('LoginScreen', () => {
  it('タイトルとログイン手段が表示される', () => {
    render(
      <LoginScreen
        onGoogleLogin={vi.fn()}
        onMagicLinkLogin={vi.fn()}
        authError={null}
      />
    );
    expect(screen.getByText('京都検定 3 級 問題集')).toBeInTheDocument();
    expect(screen.getByText('Google でログイン')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('メールアドレス')).toBeInTheDocument();
  });

  it('認証エラーが表示される', () => {
    render(
      <LoginScreen
        onGoogleLogin={vi.fn()}
        onMagicLinkLogin={vi.fn()}
        authError="ログインに失敗しました"
      />
    );
    expect(screen.getByText('ログインに失敗しました')).toBeInTheDocument();
  });

  it('メール送信成功で送信済み画面に切り替わる', async () => {
    const onMagicLinkLogin = vi.fn().mockResolvedValue(true);
    render(
      <LoginScreen
        onGoogleLogin={vi.fn()}
        onMagicLinkLogin={onMagicLinkLogin}
        authError={null}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('メールアドレス'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.submit(screen.getByText('ログインリンクを送信'));
    expect(onMagicLinkLogin).toHaveBeenCalledWith('test@example.com');
    expect(
      await screen.findByText(/ログイン用リンクを送信しました/)
    ).toBeInTheDocument();
  });
});
