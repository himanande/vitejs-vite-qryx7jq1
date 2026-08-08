import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { ensureMyProfile } from '../lib/quizApi';
import type { UserProfile } from '../types/db';

interface AuthState {
  /** セッション復元が完了するまで true */
  initializing: boolean;
  user: User | null;
  profile: UserProfile | null;
  authError: string | null;
}

export interface UseAuthResult extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

function displayNameOf(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return (
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user.email?.split('@')[0] ??
    null
  );
}

export function useAuth(): UseAuthResult {
  const [state, setState] = useState<AuthState>({
    initializing: true,
    user: null,
    profile: null,
    authError: null,
  });

  useEffect(() => {
    let cancelled = false;

    const applyUser = async (user: User | null) => {
      if (!user) {
        if (!cancelled) {
          setState((s) => ({ ...s, initializing: false, user: null, profile: null }));
        }
        return;
      }
      let profile: UserProfile | null = null;
      try {
        profile = await ensureMyProfile(user.id, displayNameOf(user));
      } catch (e) {
        console.error('プロフィール取得に失敗:', e);
      }
      if (!cancelled) {
        setState((s) => ({ ...s, initializing: false, user, profile }));
      }
    };

    supabase.auth.getSession().then(({ data }) => applyUser(data.session?.user ?? null));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        void applyUser(session?.user ?? null);
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState((s) => ({ ...s, authError: null }));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setState((s) => ({ ...s, authError: `Google ログインに失敗しました: ${error.message}` }));
    }
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    setState((s) => ({ ...s, authError: null }));
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setState((s) => ({
        ...s,
        authError: `ログインメールの送信に失敗しました: ${error.message}`,
      }));
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState((s) => ({ ...s, user: null, profile: null }));
  }, []);

  return { ...state, signInWithGoogle, signInWithMagicLink, signOut };
}
