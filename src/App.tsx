import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  User,
  LogOut,
  BookOpen,
  Trophy,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react';
import './App.css';

interface Category {
  id: number;
  name: string;
  description: string;
  display_order: number;
}

interface Theme {
  id: number;
  category_id: number;
  name: string;
  description: string;
  display_order: number;
}

interface Question {
  id: number;
  theme_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
  explanation: string;
  difficulty_level: number;
  is_premium: boolean;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [userStats, setUserStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    studyStreak: 0,
    dailyQuestions: 0,
  });
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
  });
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10); // 0は全問
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(0); // 0はすべて
  const [isSetupReady, setIsSetupReady] = useState(false);
  const [answerResult, setAnswerResult] = useState<any>(null);

  // 認証用 State (Supabase Auth)
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 復習機能用 State (localStorage と連携)
  const [wrongQuestionIds, setWrongQuestionIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('kyotokentei3_wrong_questions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [sessionWrongIds, setSessionWrongIds] = useState<number[]>([]);

  // 管理画面用 State
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    monthlyRevenue: 0,
    totalQuestions: 534,
  });

  const saveWrongQuestions = (newIds: number[]) => {
    setWrongQuestionIds(newIds);
    try {
      localStorage.setItem('kyotokentei3_wrong_questions', JSON.stringify(newIds));
    } catch (e) {
      console.error('Failed to save wrong questions to localStorage', e);
    }
  };

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && profiles) {
        setAdminUsers(profiles);
        const premiumCount = profiles.filter((p) => p.is_premium).length;
        setAdminStats({
          totalUsers: profiles.length,
          freeUsers: profiles.length - premiumCount,
          premiumUsers: premiumCount,
          monthlyRevenue: premiumCount * 680,
          totalQuestions: 534,
        });
      }
    } catch (e) {
      console.error('Error loading admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserPremium = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_premium: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      await loadAdminStats();
    } catch (e) {
      console.error('Error toggling user premium:', e);
    }
  };

  const FREE_DAILY_LIMIT = 10;
  const [showLimitModal, setShowLimitModal] = useState(false);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  // 本日解答数の初期化と日付自動リセット
  useEffect(() => {
    const today = getTodayString();
    const savedDate = localStorage.getItem('kyotokentei3_last_date');
    const savedCount = localStorage.getItem('kyotokentei3_daily_count');

    if (savedDate !== today) {
      localStorage.setItem('kyotokentei3_last_date', today);
      localStorage.setItem('kyotokentei3_daily_count', '0');
      setUserStats((prev) => ({ ...prev, dailyQuestions: 0 }));
    } else if (savedCount) {
      setUserStats((prev) => ({ ...prev, dailyQuestions: parseInt(savedCount, 10) || 0 }));
    }
  }, []);

  // Stripe 決済完了検出 ＆ プレミアム権限自動反映
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('payment') === 'success') {
      handlePaymentSuccess();
    }
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('user_profiles').update({ is_premium: true }).eq('id', session.user.id);
        setUser((prev: any) => (prev ? { ...prev, isPremium: true } : prev));
        alert('🎉 プレミアムプランのご登録ありがとうございます！全530問無制限アクセスが解放されました。');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Error enabling premium status:', e);
    }
  };

  const handleUpgradeToPremium = () => {
    // Stripe Checkout リダイレクト (本番URLがある場合は移動、ない場合は案内とテスト有効化)
    const stripeCheckoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL || '';
    if (stripeCheckoutUrl) {
      window.location.href = stripeCheckoutUrl;
    } else {
      const confirmDemo = window.confirm(
        '👑 プレミアムプラン（月額 680 円）\n\nStripe Checkout 連携のデモテストとして、このアカウントのプレミアム権限を有効化しますか？\n(本番運用時はStripeのCheckout URLを設定することで自動連携されます)'
      );
      if (confirmDemo) {
        handlePaymentSuccess();
      }
    }
  };

  // ユーザーログイン状態変更時に自動的にダッシュボードを開く
  useEffect(() => {
    if (user && currentView === 'login') {
      setCurrentView('dashboard');
      loadCategories();
    }
  }, [user]);

  // Supabase Auth セッション監視
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await setupUserProfile(session.user);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await setupUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentView('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const DEFAULT_CATEGORIES: Category[] = [
    { id: 1, name: '歴史・史跡', description: '平安京遷都から幕末・明治維新までの京都の歴史と史跡', icon: '🏯', display_order: 1, is_active: true },
    { id: 2, name: '神社・寺院', description: '国宝や重要文化財を擁する京都の有名神社・寺院', icon: '⛩️', display_order: 2, is_active: true },
    { id: 3, name: '建築・庭園・美術', description: '枯山水、回遊式庭園、伝統建築と美術品', icon: '🏡', display_order: 3, is_active: true },
    { id: 4, name: '芸術・文化', description: '茶道、華道、能楽、京焼き、伝統工芸', icon: '🎨', display_order: 4, is_active: true },
    { id: 5, name: '祭り・行事', description: '祇園祭、葵祭、時代祭の京都三大祭と四季の行事', icon: '🏮', display_order: 5, is_active: true },
    { id: 6, name: '食文化', description: '京料理、精進料理、和菓子、おばんざいと京都の食', icon: '🍵', display_order: 6, is_active: true },
  ];

  // データ取得関数
  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error || !data || data.length === 0) {
        setCategories(DEFAULT_CATEGORIES);
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error loading categories, using fallback:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const loadThemes = async (categoryId: number) => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setThemes(data || []);
    } catch (err) {
      console.error('Error loading themes:', err);
    }
  };

  // クイズ開始関数（フィルタリングと出題数の制限）
  const startQuiz = async () => {
    if (!user?.isPremium && userStats.dailyQuestions >= FREE_DAILY_LIMIT) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true);

      if (isReviewMode) {
        if (wrongQuestionIds.length === 0) {
          setQuestions([]);
          setCurrentQuestion(null);
          setCurrentView('questions');
          setLoading(false);
          return;
        }
        query = query.in('id', wrongQuestionIds);
      } else if (selectedTheme) {
        query = query.eq('theme_id', selectedTheme.id);
      } else if (selectedCategory) {
        query = query.eq('category_id', selectedCategory.id);
      }

      if (selectedDifficulty > 0) {
        query = query.eq('difficulty_level', selectedDifficulty);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredQuestions = data || [];

      // 配列のランダムシャッフル
      filteredQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5);

      // 出題数の制限
      if (selectedQuestionCount > 0 && filteredQuestions.length > selectedQuestionCount) {
        filteredQuestions = filteredQuestions.slice(0, selectedQuestionCount);
      }

      setQuestions(filteredQuestions);
      setSessionStats({ total: 0, correct: 0 });
      setSessionWrongIds([]);
      setAnswerResult(null);

      if (filteredQuestions.length > 0) {
        setCurrentQuestion(filteredQuestions[0]);
      } else {
        setCurrentQuestion(null);
      }
      setCurrentView('questions');
    } catch (err) {
      console.error('Error starting quiz:', err);
      setQuestions([]);
      setCurrentQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const startQuizWithIds = async (targetIds: number[]) => {
    if (targetIds.length === 0) return;
    if (!user?.isPremium && userStats.dailyQuestions >= FREE_DAILY_LIMIT) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', targetIds)
        .eq('is_active', true);

      if (error) throw error;

      let filteredQuestions = data || [];
      filteredQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5);

      setQuestions(filteredQuestions);
      setSessionStats({ total: 0, correct: 0 });
      setSessionWrongIds([]);
      setAnswerResult(null);

      if (filteredQuestions.length > 0) {
        setCurrentQuestion(filteredQuestions[0]);
      } else {
        setCurrentQuestion(null);
      }
      setCurrentView('questions');
    } catch (err) {
      console.error('Error starting specific ID quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  // ユーザープロフィールのセットアップ・取得
  const setupUserProfile = async (authUser: any) => {
    let displayName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'ユーザー';
    let isPremium = false;
    let isAdmin = authUser.email === 'ikeda3.note@gmail.com';

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        isPremium = profile.is_premium || false;
        displayName = profile.display_name || displayName;
        if (profile.is_admin) isAdmin = true;
      } else {
        try {
          await supabase.from('user_profiles').upsert([
            {
              id: authUser.id,
              display_name: displayName,
              avatar_url: authUser.user_metadata?.avatar_url || '',
              provider: authUser.app_metadata?.provider || 'email',
              is_premium: false,
            },
          ]);
        } catch (e) {
          console.warn('user_profiles upsert warn (ignored for login flow):', e);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: displayName,
        provider: authUser.app_metadata?.provider || 'email',
        isPremium: isPremium,
        isAdmin: isAdmin,
      });

      setCurrentView('dashboard');
      await loadCategories();
      setLoading(false);
    }
  };

  // Supabase Auth: OAuth ログイン
  const handleOAuthLogin = async (provider: 'google' | 'twitter') => {
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(`Error logging in with ${provider}:`, err);
      setAuthError(`${provider} ログインでエラーが発生しました。設定を確認してください。`);
      setLoading(false);
    }
  };

  // Supabase Auth: メールマジックリンク (パスワードレス) ログイン
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setAuthError('有効なメールアドレスを入力してください');
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err: any) {
      console.error('Error sending magic link:', err);
      setAuthError('マジックリンクの送信に失敗しました。時間をおいて再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Signout error', e);
    }
    setUser(null);
    setCurrentView('login');
    setMagicLinkSent(false);
    setEmailInput('');
    setAuthError(null);
    setCategories([]);
    setThemes([]);
    setQuestions([]);
    setCurrentQuestion(null);
    setSelectedCategory(null);
    setSelectedTheme(null);
    setAnswerResult(null);
    setSessionStats({ total: 0, correct: 0 });
  };

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    setCurrentView('themes');
    await loadThemes(category.id);
  };

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    setIsReviewMode(false);
    setSelectedQuestionCount(10);
    setSelectedDifficulty(0);
    setIsSetupReady(false);
    setCurrentView('quizSetup');

    setTimeout(() => {
      setIsSetupReady(true);
    }, 300);
  };

  const handleCategoryQuizSetup = (category: Category) => {
    setSelectedCategory(category);
    setSelectedTheme(null);
    setIsReviewMode(false);
    setSelectedQuestionCount(10);
    setSelectedDifficulty(0);
    setIsSetupReady(false);
    setCurrentView('quizSetup');

    setTimeout(() => {
      setIsSetupReady(true);
    }, 300);
  };

  const handleAllQuizSetup = () => {
    setSelectedCategory(null);
    setSelectedTheme(null);
    setIsReviewMode(false);
    setSelectedQuestionCount(10);
    setSelectedDifficulty(0);
    setIsSetupReady(false);
    setCurrentView('quizSetup');

    setTimeout(() => {
      setIsSetupReady(true);
    }, 300);
  };

  const handleReviewQuizSetup = () => {
    setSelectedCategory(null);
    setSelectedTheme(null);
    setIsReviewMode(true);
    setSelectedQuestionCount(10);
    setSelectedDifficulty(0);
    setIsSetupReady(false);
    setCurrentView('quizSetup');

    setTimeout(() => {
      setIsSetupReady(true);
    }, 300);
  };

  const handleAnswer = (selectedOption: number) => {
    if (!currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correct_answer;

    setAnswerResult({
      selected: selectedOption,
      isCorrect: isCorrect,
      correctAnswer: currentQuestion.correct_answer,
    });

    if (isCorrect) {
      // 復習で正解した問題は間違えた問題リストから解除
      if (wrongQuestionIds.includes(currentQuestion.id)) {
        const updated = wrongQuestionIds.filter((id) => id !== currentQuestion.id);
        saveWrongQuestions(updated);
      }
    } else {
      // 不正解の場合は間違えた問題リストに追加
      if (!wrongQuestionIds.includes(currentQuestion.id)) {
        const updated = [...wrongQuestionIds, currentQuestion.id];
        saveWrongQuestions(updated);
      }
      setSessionWrongIds((prev) => [...prev, currentQuestion.id]);
    }

    const newDailyCount = userStats.dailyQuestions + 1;
    localStorage.setItem('kyotokentei3_daily_count', newDailyCount.toString());
    localStorage.setItem('kyotokentei3_last_date', getTodayString());

    setUserStats((prev) => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      dailyQuestions: newDailyCount,
    }));

    setSessionStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
  };

  const goToNextQuestion = () => {
    const currentIndex = questions.findIndex(
      (q) => q.id === currentQuestion.id
    );

    if (currentIndex === questions.length - 1) {
      // 最後の問題の場合
      setCurrentView('themeComplete');
    } else {
      // 次の問題へ
      const nextIndex = currentIndex + 1;
      setCurrentQuestion(questions[nextIndex]);
      setAnswerResult(null);
    }
  };

  // ログイン画面
  if (!user || currentView === 'login') {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">🏯</div>
            <h1>京都検定3級</h1>
            <p>問題集アプリ</p>
            <div className="stackblitz-badge">🔒 パスワード不要の安全認証</div>
          </div>

          {authError && (
            <div className="auth-error-box">
              <p>⚠️ {authError}</p>
            </div>
          )}

          {magicLinkSent ? (
            <div className="magic-link-success">
              <div className="success-icon">📧</div>
              <h3>ログイン用メールを送信しました！</h3>
              <p>
                <strong>{emailInput}</strong> 宛にログインリンクをお送りしました。メール内のリンクをクリックしてアプリにお戻りください。
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                ← 戻る
              </button>
            </div>
          ) : (
            <div className="login-buttons">
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
                className="btn btn-google"
              >
                <span>G</span>
                Google でログイン
              </button>

              {!showEmailForm ? (
                <button
                  onClick={() => setShowEmailForm(true)}
                  disabled={loading}
                  className="btn btn-email"
                >
                  <span>✉️</span>
                  メールでログイン（パスワード不要）
                </button>
              ) : (
                <form onSubmit={handleMagicLinkLogin} className="magic-link-form" style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#4b5563', textAlign: 'left', fontWeight: 'bold' }}>
                    ✉️ メールアドレス（パスワード不要）
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={loading}
                    className="email-input"
                    required
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="btn btn-secondary"
                      style={{ width: '35%' }}
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !emailInput}
                      className="btn btn-primary"
                      style={{ width: '65%' }}
                    >
                      {loading ? '送信中...' : 'メール送信 →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 管理者用ダッシュボード画面
  if (currentView === 'admin') {
    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="back-btn"
            >
              ← アプリに戻る
            </button>
            <div className="header-left">
              <span className="logo">⚙️</span>
              <h1>管理者ダッシュボード</h1>
              <span className="badge" style={{ background: '#4f46e5' }}>管理者モード</span>
            </div>
            <div className="header-right">
              <button onClick={loadAdminStats} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                🔄 データを更新
              </button>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            {/* サマリーメトリクス */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div>
                  <p>総登録ユーザー数</p>
                  <strong style={{ fontSize: '1.75rem', color: '#1d4ed8' }}>{adminStats.totalUsers} 名</strong>
                </div>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
                <div>
                  <p>有料プレミアム会員</p>
                  <strong style={{ fontSize: '1.75rem', color: '#15803d' }}>{adminStats.premiumUsers} 名</strong>
                </div>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #eab308' }}>
                <div>
                  <p>今月の推計月間収益</p>
                  <strong style={{ fontSize: '1.75rem', color: '#b45309' }}>￥{adminStats.monthlyRevenue.toLocaleString()}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>（￥680 × {adminStats.premiumUsers}名）</span>
                </div>
              </div>

              <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                <div>
                  <p>収録問題数</p>
                  <strong style={{ fontSize: '1.75rem', color: '#6d28d9' }}>{adminStats.totalQuestions} 問</strong>
                </div>
              </div>
            </div>

            {/* ユーザー管理テーブル */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>登録ユーザー一覧・会員ステータス管理</h2>
                  <p>ユーザーの登録状況と手動権限変更が行えます</p>
                </div>
              </div>
              <div className="card-content" style={{ overflowX: 'auto' }}>
                {loading ? (
                  <div className="loading"><div className="spinner"></div><p>データを読み込み中...</p></div>
                ) : adminUsers.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                        <th style={{ padding: '0.75rem' }}>ユーザーID / 表示名</th>
                        <th style={{ padding: '0.75rem' }}>プロバイダー</th>
                        <th style={{ padding: '0.75rem' }}>登録日時</th>
                        <th style={{ padding: '0.75rem' }}>会員ステータス</th>
                        <th style={{ padding: '0.75rem' }}>権限操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <strong>{u.display_name || '名称未設定'}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.id}</div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className="badge" style={{ background: u.provider === 'google' ? '#ea4335' : '#4b5563' }}>
                              {u.provider || 'email'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#4b5563' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleString('ja-JP') : '-'}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {u.is_premium ? (
                              <span className="premium-badge">👑 プレミアム (月額680円)</span>
                            ) : (
                              <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>FREE (無料会員)</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              onClick={() => toggleUserPremium(u.id, u.is_premium)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                            >
                              {u.is_premium ? '無料会員へ変更' : '👑 プレミアムへ昇格'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <p>登録ユーザーはまだありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ダッシュボード画面
  if (currentView === 'dashboard') {
    const accuracy =
      userStats.questionsAnswered > 0
        ? Math.round(
            (userStats.correctAnswers / userStats.questionsAnswered) * 100
          )
        : 0;

    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <div className="header-left">
              <span className="logo">🏯</span>
              <h1>京都検定3級</h1>
              <span className="badge">StackBlitz版</span>
            </div>

            <div className="header-right">
              <div className="user-info">
                <User size={20} />
                <span>{user?.name || 'ユーザー'}</span>
                {user?.isPremium && (
                  <span className="premium-badge">プレミアム</span>
                )}
              </div>
              {user?.isAdmin && (
                <button
                  onClick={async () => {
                    setCurrentView('admin');
                    await loadAdminStats();
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#4f46e5', color: 'white', borderColor: '#4338ca' }}
                >
                  ⚙️ 管理画面
                </button>
              )}
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-card">
                <BookOpen className="stat-icon blue" size={24} />
                <div>
                  <p>解答数</p>
                  <strong>{userStats.questionsAnswered}問</strong>
                </div>
              </div>

              <div className="stat-card">
                <Trophy className="stat-icon yellow" size={24} />
                <div>
                  <p>正答率</p>
                  <strong>{accuracy}%</strong>
                </div>
              </div>

              <div className="stat-card">
                <Clock className="stat-icon green" size={24} />
                <div>
                  <p>連続学習</p>
                  <strong>{userStats.studyStreak}日</strong>
                </div>
              </div>

              <div className="stat-card">
                <Star className="stat-icon purple" size={24} />
                <div>
                  <p>今日の問題</p>
                  <strong>
                    {user?.isPremium
                      ? `${userStats.dailyQuestions}問 (無制限)`
                      : `${userStats.dailyQuestions} / ${FREE_DAILY_LIMIT}問`}
                  </strong>
                </div>
              </div>
            </div>

            {/* 弱点克服・復習モードカード */}
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
                background: wrongQuestionIds.length > 0 ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#f9fafb',
                border: wrongQuestionIds.length > 0 ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
              }}
            >
              <div
                className="card-content"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      color: wrongQuestionIds.length > 0 ? '#1e40af' : '#4b5563',
                      fontWeight: 'bold',
                      marginBottom: '0.25rem',
                    }}
                  >
                    🎯 弱点克服！間違い復習モード
                  </h3>
                  <p style={{ color: wrongQuestionIds.length > 0 ? '#1e3a8a' : '#6b7280', fontSize: '0.9rem' }}>
                    {wrongQuestionIds.length > 0
                      ? `過去に間違えた問題が ${wrongQuestionIds.length} 問記録されています。繰り返し解いて弱点をなくそう！`
                      : '現在、間違えた問題はありません！素晴らしい学習状況です。'}
                  </p>
                </div>
                {wrongQuestionIds.length > 0 && (
                  <button
                    onClick={handleReviewQuizSetup}
                    className="btn btn-primary"
                    style={{
                      background: '#2563eb',
                      borderColor: '#1d4ed8',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                    }}
                  >
                    ✏️ 条件を設定して復習スタート →
                  </button>
                )}
              </div>
            </div>

            {/* 総合演習スタートカード */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)', border: '1px solid #fecdd3' }}>
              <div className="card-content" style={{ display: 'flex', alignItems: 'center', justify_content: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#9f1239', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    🔥 全カテゴリ総合ランダム演習
                  </h3>
                  <p style={{ color: '#881337', fontSize: '0.9rem' }}>
                    収録されている全530問以上の問題から出題数・難易度を指定して挑戦！
                  </p>
                </div>
                <button
                  onClick={handleAllQuizSetup}
                  className="btn btn-primary"
                  style={{ background: '#e11d48', borderColor: '#be123c', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  ⚙️ 条件を設定してスタート →
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>学習カテゴリ</h2>
                <p>
                  {loading
                    ? 'データを読み込み中...'
                    : `${categories.length}個のカテゴリが利用可能です`}
                </p>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Supabaseからデータを取得中...</p>
                  </div>
                ) : categories.length > 0 ? (
                  <div className="category-grid">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className="category-card"
                      >
                        <div>
                          <h3>{category.name}</h3>
                          <p>{category.description}</p>
                        </div>
                        <ChevronRight size={20} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Supabase接続を確認してください</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        {renderLimitModal()}
      </div>
    );
  }

  // テーマ選択画面
  if (currentView === 'themes') {
    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="back-btn"
            >
              ← 戻る
            </button>
            <div className="header-left">
              <span className="logo">🏯</span>
              <h1>{selectedCategory?.name}</h1>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <button onClick={() => setCurrentView('dashboard')}>ホーム</button>
              <span className="separator">/</span>
              <span className="current">{selectedCategory?.name}</span>
            </nav>

            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2>テーマ選択</h2>
                  <p>{themes.length}個のテーマが利用可能です</p>
                </div>
                {selectedCategory && (
                  <button
                    onClick={() => handleCategoryQuizSetup(selectedCategory)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
                  >
                    ⚡ 「{selectedCategory.name}」全体から演習 →
                  </button>
                )}
              </div>

              <div className="card-content">
                <div className="theme-grid">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme)}
                      className="theme-card"
                    >
                      <div>
                        <h3>{theme.name}</h3>
                        <p>{theme.description}</p>
                      </div>
                      <ChevronRight size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 演習条件設定画面
  if (currentView === 'quizSetup') {
    const setupTitle = selectedTheme
      ? selectedTheme.name
      : selectedCategory
      ? `${selectedCategory.name} （総合）`
      : '全カテゴリ総合ランダム演習';

    const setupSubtitle = selectedTheme
      ? '選択したテーマの問題から出題されます'
      : selectedCategory
      ? '選択したカテゴリ内の全テーマからランダムに出題されます'
      : 'データベース内の全530問以上からランダムに出題されます';

    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <button
              onClick={() => setCurrentView(selectedCategory ? 'themes' : 'dashboard')}
              className="back-btn"
            >
              ← 戻る
            </button>
            <div className="header-left">
              <span className="logo">🏯</span>
              <h1>{setupTitle}</h1>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <button onClick={() => setCurrentView('dashboard')}>ホーム</button>
              {selectedCategory && (
                <>
                  <span className="separator">/</span>
                  <button onClick={() => setCurrentView('themes')}>{selectedCategory.name}</button>
                </>
              )}
              <span className="separator">/</span>
              <span className="current">{setupTitle}</span>
            </nav>

            <div className="card">
              <div className="card-header" style={{ background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                  <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>演習条件の設定</h2>
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>{setupSubtitle}</p>
              </div>

              <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem 1.5rem' }}>
                {/* 出題数選択 */}
                <div className="setup-group">
                  <label className="setup-label">📌 出題数を選択</label>
                  <div className="chip-group">
                    {[
                      { label: '5問', value: 5 },
                      { label: '10問', value: 10 },
                      { label: '20問', value: 20 },
                      { label: '全問チャレンジ', value: 0 },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedQuestionCount(item.value)}
                        className={`chip-btn ${selectedQuestionCount === item.value ? 'active' : ''}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 難易度選択 */}
                <div className="setup-group">
                  <label className="setup-label">🎯 難易度を選択</label>
                  <div className="chip-group">
                    {[
                      { label: 'すべて', value: 0 },
                      { label: '★1 基礎', value: 1 },
                      { label: '★2 標準', value: 2 },
                      { label: '★3 難問', value: 3 },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedDifficulty(item.value)}
                        className={`chip-btn ${selectedDifficulty === item.value ? 'active' : ''}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={startQuiz}
                    disabled={loading || !isSetupReady}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem',
                      fontSize: '1.15rem',
                      fontWeight: 'bold',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                      opacity: isSetupReady ? 1 : 0.7,
                    }}
                  >
                    {loading ? '問題読み込み中...' : '🚀 この設定で演習スタート！'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        {renderLimitModal()}
      </div>
    );
  }

  // 問題画面
  if (currentView === 'questions') {
    // 問題がない場合の表示
    if (!currentQuestion || questions.length === 0) {
      return (
        <div className="app">
          <header className="header">
            <div className="container">
              <button
                onClick={() => setCurrentView('themes')}
                className="back-btn"
              >
                ← 戻る
              </button>
              <div className="header-left">
                <span className="logo">🏯</span>
                <h1>{selectedTheme?.name}</h1>
              </div>
            </div>
          </header>

          <main className="main">
            <div className="container">
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <button onClick={() => setCurrentView('dashboard')}>ホーム</button>
                <span className="separator">/</span>
                <button onClick={() => setCurrentView('themes')}>{selectedCategory?.name}</button>
                <span className="separator">/</span>
                <span className="current">{selectedTheme?.name}</span>
              </nav>

              <div className="card">
                <div
                  className="empty-state"
                  style={{ padding: '3rem', textAlign: 'center' }}
                >
                  <h2>📝 問題準備中</h2>
                  <p>このテーマの問題は現在準備中です。</p>
                  <p>他のテーマをお試しください。</p>
                  <button
                    onClick={() => setCurrentView('themes')}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                  >
                    テーマ一覧に戻る
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      );
    }

    const currentIndex = questions.findIndex(
      (q) => q.id === currentQuestion.id
    );
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <button
              onClick={() => setCurrentView('quizSetup')}
              className="back-btn"
            >
              ← 戻る
            </button>
            <div className="header-left">
              <span className="logo">🏯</span>
              <h1>{selectedTheme?.name}</h1>
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <button onClick={() => setCurrentView('dashboard')}>ホーム</button>
              <span className="separator">/</span>
              <button onClick={() => setCurrentView('themes')}>{selectedCategory?.name}</button>
              <span className="separator">/</span>
              <span className="current">{selectedTheme?.name}</span>
            </nav>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="progress-section">
                <div className="progress-text">
                  <span>進捗状況 ({progressPercent}%)</span>
                  <span>第 {currentIndex + 1} 問 / 全 {questions.length} 問</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="question-badges">
                <span className="difficulty-badge">
                  難易度 {currentQuestion.difficulty_level}
                </span>
                {currentQuestion.is_premium && (
                  <span className="premium-badge">プレミアム</span>
                )}
              </div>

              <h2 className="question-text">{currentQuestion.question_text}</h2>

              <div className="options">
                {[
                  { key: 'A', text: currentQuestion.option_a },
                  { key: 'B', text: currentQuestion.option_b },
                  { key: 'C', text: currentQuestion.option_c },
                  { key: 'D', text: currentQuestion.option_d },
                ].map((option, index) => {
                  let className = 'option';

                  if (answerResult) {
                    if (index === answerResult.correctAnswer) {
                      className += ' correct';
                    } else if (
                      index === answerResult.selected &&
                      !answerResult.isCorrect
                    ) {
                      className += ' incorrect';
                    } else {
                      className += ' disabled';
                    }
                  }

                  return (
                    <button
                      key={option.key}
                      onClick={() => !answerResult && handleAnswer(index)}
                      disabled={!!answerResult}
                      className={className}
                    >
                      <span className="option-key">{option.key}.</span>
                      {option.text}
                      {answerResult && index === answerResult.correctAnswer && (
                        <span className="result-icon">✓</span>
                      )}
                      {answerResult &&
                        index === answerResult.selected &&
                        !answerResult.isCorrect && (
                          <span className="result-icon">✗</span>
                        )}
                    </button>
                  );
                })}
              </div>

              {answerResult && (
                <div
                  className={`explanation ${
                    answerResult.isCorrect ? 'correct' : 'incorrect'
                  }`}
                >
                  <h3>{answerResult.isCorrect ? '🎉 正解！' : '❌ 不正解'}</h3>
                  <p>{currentQuestion.explanation}</p>
                  <button onClick={goToNextQuestion} className="btn btn-next">
                    {currentIndex === questions.length - 1
                      ? 'テーマ完了'
                      : '次の問題へ →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // テーマ完了画面
  if (currentView === 'themeComplete') {
    const sessionAccuracy =
      sessionStats.total > 0
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : 0;

    let rankBadge = { text: '💪 チャレンジ達成！', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5', icon: '🎯' };
    if (sessionAccuracy === 100) {
      rankBadge = { text: '🏆 満点達成！完璧です！', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: '👑' };
    } else if (sessionAccuracy >= 80) {
      rankBadge = { text: '🎉 合格ライン達成！京都通！', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', icon: '🌟' };
    } else if (sessionAccuracy >= 60) {
      rankBadge = { text: '👍 もう一歩！復習しよう！', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: '📖' };
    }

    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <span className="logo">🏯</span>
            <h1>京都検定3級</h1>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <button onClick={() => setCurrentView('dashboard')}>ホーム</button>
              <span className="separator">/</span>
              <button onClick={() => setCurrentView('themes')}>{selectedCategory?.name}</button>
              <span className="separator">/</span>
              <span className="current">{selectedTheme?.name} (完了)</span>
            </nav>

            <div className="card theme-complete-card">
              <div className="theme-complete-content">
                <div className="rank-badge-container">
                  <span className="rank-icon">{rankBadge.icon}</span>
                  <span className="rank-badge" style={{ color: rankBadge.color, backgroundColor: rankBadge.bg, borderColor: rankBadge.border }}>
                    {rankBadge.text}
                  </span>
                </div>

                <h2 className="complete-title">{selectedTheme?.name} 完了！</h2>
                <p className="complete-sub">お疲れ様でした！今回の演習結果です。</p>

                <div className="score-summary-card" style={{ background: rankBadge.bg, borderColor: rankBadge.border }}>
                  <div className="score-main">
                    <span className="score-label">正解率</span>
                    <strong className="score-percent" style={{ color: rankBadge.color }}>
                      {sessionAccuracy}%
                    </strong>
                  </div>
                  <div className="score-details-grid">
                    <div className="score-detail-item">
                      <span className="detail-label">総出題数</span>
                      <strong className="detail-value">{sessionStats.total} 問</strong>
                    </div>
                    <div className="score-detail-item">
                      <span className="detail-label">正解数</span>
                      <strong className="detail-value text-green">{sessionStats.correct} 問</strong>
                    </div>
                    <div className="score-detail-item">
                      <span className="detail-label">不正解</span>
                      <strong className="detail-value text-red">{sessionStats.total - sessionStats.correct} 問</strong>
                    </div>
                  </div>
                </div>

                <div className="complete-actions">
                  {sessionWrongIds.length > 0 && (
                    <button
                      onClick={() => startQuizWithIds(sessionWrongIds)}
                      className="btn btn-lg"
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1.5px solid #fecaca',
                        marginBottom: '0.25rem',
                      }}
                    >
                      ❌ 今回間違えた {sessionWrongIds.length} 問を復習する
                    </button>
                  )}
                  <button
                    onClick={startQuiz}
                    className="btn btn-primary btn-lg"
                  >
                    🔄 同じ設定で再挑戦
                  </button>
                  <button
                    onClick={() => setCurrentView('themes')}
                    className="btn btn-secondary btn-lg"
                  >
                    📂 他のテーマを選択
                  </button>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="btn btn-ghost btn-lg"
                  >
                    🏠 ダッシュボードに戻る
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // モーダルヘルパー関数
  const renderLimitModal = () => {
    if (!showLimitModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-icon">🎉</span>
            <h2>本日の無料枠（10問）完了！</h2>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: '1.05rem', color: '#1f2937', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              本日の無料演習上限（10問）に達しました！
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              素晴らしい学習ペースです。明日になると自動的にリセットされ、再び10問チャレンジできます。
            </p>
            <div className="premium-upgrade-box">
              <div className="premium-badge-lg">👑 プレミアムプランのご案内</div>
              <p className="premium-desc">
                月額 680 円で <strong>全530問以上が解き放題・無制限</strong>！難易度制限なし＆無制限復習機能で一気に合格を目指そう！
              </p>
            </div>
          </div>
          <div className="modal-actions">
            <button
              onClick={() => {
                setShowLimitModal(false);
                handleUpgradeToPremium();
              }}
              className="btn btn-primary btn-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#b45309' }}
            >
              👑 月額680円でプレミアム登録 →
            </button>
            <button
              onClick={() => {
                setShowLimitModal(false);
                setCurrentView('dashboard');
              }}
              className="btn btn-secondary btn-lg"
            >
              ダッシュボードへ戻る
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="login-container">
      <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#4b5563', fontWeight: 'bold' }}>データを読み込み中...</p>
        <button
          onClick={() => {
            setLoading(false);
            if (user) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('login');
            }
          }}
          className="btn btn-secondary"
          style={{ marginTop: '1.5rem' }}
        >
          画面が開かない場合はこちらをタップ
        </button>
      </div>
    </div>
  );
}

export default App;
