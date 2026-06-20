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
  const [answerResult, setAnswerResult] = useState<any>(null);

  // データ取得関数
  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // 診断用関数を追加
  const debugData = async () => {
    console.log('=== データベース診断開始 ===');

    try {
      // カテゴリ確認
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      console.log('📂 カテゴリ数:', categoriesData?.length);
      console.log('📂 カテゴリ一覧:', categoriesData);

      // テーマ確認
      const { data: themesData, error: themesError } = await supabase
        .from('themes')
        .select('*')
        .order('category_id, display_order');

      console.log('🏷️ テーマ数:', themesData?.length);
      console.log('🏷️ テーマ一覧:', themesData);

      // 問題確認
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*');

      console.log('❓ 問題数:', questionsData?.length);
      console.log('❓ 問題一覧:', questionsData);

      // テーマ別問題数確認
      if (questionsData && themesData) {
        themesData.forEach((theme) => {
          const themeQuestions = questionsData.filter(
            (q) => q.theme_id === theme.id
          );
          console.log(`🎯 テーマ "${theme.name}": ${themeQuestions.length}問`);
        });
      }
    } catch (error) {
      console.error('診断エラー:', error);
    }

    console.log('=== 診断完了 ===');
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

  const loadQuestions = async (themeId: number) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('theme_id', themeId)
        .eq('is_active', true);

      if (error) throw error;

      console.log(`テーマID ${themeId} の問題数: ${data?.length || 0}`);

      setQuestions(data || []);
      if (data && data.length > 0) {
        setCurrentQuestion(data[0]);
      } else {
        // 問題がない場合の処理
        setCurrentQuestion(null);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setQuestions([]);
      setCurrentQuestion(null);
    }
  };

  // 認証関数（デモ用）
  const handleLogin = async (provider: string) => {
    setLoading(true);

    const userData = {
      id: `demo-${provider}-user`,
      email: `user@${provider}.com`,
      name: `${provider}ユーザー`,
      provider: provider,
      isPremium: provider === 'google',
    };

    setUser(userData);
    setUserStats({
      questionsAnswered: 15,
      correctAnswers: 12,
      studyStreak: 3,
      dailyQuestions: userData.isPremium ? 25 : 3,
    });

    setCurrentView('dashboard');
    await loadCategories();
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    setCategories([]);
    setThemes([]);
    setQuestions([]);
    setCurrentQuestion(null);
    setSelectedCategory(null);
    setSelectedTheme(null);
    setAnswerResult(null);
  };

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    setCurrentView('themes');
    await loadThemes(category.id);
  };

  const handleThemeSelect = async (theme: Theme) => {
    setSelectedTheme(theme);
    setCurrentView('questions');
    await loadQuestions(theme.id);
    setAnswerResult(null);
  };

  const handleAnswer = (selectedOption: number) => {
    if (!currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correct_answer;

    setAnswerResult({
      selected: selectedOption,
      isCorrect: isCorrect,
      correctAnswer: currentQuestion.correct_answer,
    });

    setUserStats((prev) => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      dailyQuestions: prev.dailyQuestions + 1,
    }));

    setTimeout(() => {
      if (questions.length > 1) {
        const currentIndex = questions.findIndex(
          (q) => q.id === currentQuestion.id
        );
        const nextIndex = (currentIndex + 1) % questions.length;
        setCurrentQuestion(questions[nextIndex]);
        setAnswerResult(null);
      }
    }, 3000);
  };

  // ログイン画面
  if (currentView === 'login') {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">🏯</div>
            <h1>京都検定3級</h1>
            <p>問題集アプリ</p>
            <div className="stackblitz-badge">✅ StackBlitz + Supabase連携</div>
          </div>

          <div className="login-buttons">
            <button
              onClick={() => handleLogin('google')}
              disabled={loading}
              className="btn btn-google"
            >
              <span>G</span>
              Googleでログイン
            </button>

            <button
              onClick={() => handleLogin('twitter')}
              disabled={loading}
              className="btn btn-twitter"
            >
              <span>🐦</span>
              Twitterでログイン
            </button>

            <button
              onClick={() => handleLogin('email')}
              disabled={loading}
              className="btn btn-primary"
            >
              メールでログイン
            </button>
          </div>
        </div>
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
                <span>{user.name}</span>
                {user.isPremium && (
                  <span className="premium-badge">プレミアム</span>
                )}
              </div>
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
                  <strong>{userStats.dailyQuestions}問</strong>
                </div>
              </div>
            </div>

            <div className="card">
              // ダッシュボード画面の card-header 部分を以下に置き換え
              <div className="card-header">
                <h2>学習カテゴリ</h2>
                <p>
                  {loading
                    ? 'データを読み込み中...'
                    : `${categories.length}個のカテゴリが利用可能です`}
                </p>
                {/* 診断ボタンを一時追加 */}
                <button
                  onClick={debugData}
                  style={{
                    background: '#fbbf24',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                  }}
                >
                  🔍 データ診断
                </button>
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
            <div className="card">
              <div className="card-header">
                <h2>テーマ選択</h2>
                <p>{themes.length}個のテーマが利用可能です</p>
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

  // 問題画面
  // 問題画面
  if (currentView === 'questions') {
    // 問題がない場合の表示を追加
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

    // 問題がある場合の既存表示（条件文を修正）
    return (
      <div className="app">
        <header className="header">
          // ... 既存の問題表示コード（そのまま）
        </header>

        <main className="main">
          <div className="container">
            <div className="card">
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
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <div>Loading...</div>;
}

export default App;
