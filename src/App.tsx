import { useState } from 'react';
import type { Category, Question, Theme } from './types/db';
import { useAuth } from './hooks/useAuth';
import type { AnswerLog, QuizConfig } from './lib/quizLogic';
import { LoadingScreen } from './components/common/LoadingScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { Dashboard } from './components/dashboard/Dashboard';
import { ThemeSelector } from './components/quiz/ThemeSelector';
import { QuizSetup } from './components/quiz/QuizSetup';
import { QuestionScreen } from './components/quiz/QuestionScreen';
import { ResultScreen } from './components/quiz/ResultScreen';

// 画面遷移: dashboard → (themes) → setup → quiz → result → dashboard
type View =
  | { name: 'dashboard' }
  | { name: 'themes'; category: Category }
  | { name: 'setup'; baseConfig: QuizConfig }
  | { name: 'quiz'; questions: Question[]; config: QuizConfig }
  | { name: 'result'; logs: AnswerLog[]; config: QuizConfig; limitReached: boolean };

function App() {
  const auth = useAuth();
  const [view, setView] = useState<View>({ name: 'dashboard' });

  if (auth.initializing) {
    return <LoadingScreen />;
  }

  if (!auth.user) {
    return (
      <LoginScreen
        onGoogleLogin={auth.signInWithGoogle}
        onMagicLinkLogin={auth.signInWithMagicLink}
        authError={auth.authError}
      />
    );
  }

  const goDashboard = () => setView({ name: 'dashboard' });

  const startThemeQuizSetup = (theme: Theme) =>
    setView({
      name: 'setup',
      baseConfig: {
        mode: 'theme',
        themeId: theme.id,
        themeName: theme.name,
        count: 10,
        difficulty: 0,
      },
    });

  const startCategoryQuizSetup = (categories: Category[]) =>
    setView({
      name: 'setup',
      baseConfig: {
        mode: 'category',
        categoryIds: categories.map((c) => c.id),
        categoryNames: categories.map((c) => c.name),
        count: 10,
        difficulty: 0,
      },
    });

  const startAllQuizSetup = () =>
    setView({
      name: 'setup',
      baseConfig: { mode: 'all', count: 10, difficulty: 0 },
    });

  switch (view.name) {
    case 'dashboard':
      return (
        <Dashboard
          profile={auth.profile}
          displayName={auth.profile?.display_name ?? auth.user.email ?? 'ユーザー'}
          onStartThemeMode={(category) => setView({ name: 'themes', category })}
          onStartCategoryQuiz={startCategoryQuizSetup}
          onStartAllQuiz={startAllQuizSetup}
          onSignOut={() => void auth.signOut()}
        />
      );
    case 'themes':
      return (
        <ThemeSelector
          category={view.category}
          onSelectTheme={startThemeQuizSetup}
          onBack={goDashboard}
        />
      );
    case 'setup':
      return (
        <QuizSetup
          baseConfig={view.baseConfig}
          onStart={(questions, config) => setView({ name: 'quiz', questions, config })}
          onBack={goDashboard}
        />
      );
    case 'quiz':
      return (
        <QuestionScreen
          questions={view.questions}
          userId={auth.user.id}
          onFinish={(logs, limitReached) =>
            setView({ name: 'result', logs, config: view.config, limitReached })
          }
          onAbort={goDashboard}
        />
      );
    case 'result':
      return (
        <ResultScreen
          logs={view.logs}
          config={view.config}
          limitReached={view.limitReached}
          onRetry={() => setView({ name: 'setup', baseConfig: view.config })}
          onHome={goDashboard}
        />
      );
  }
}

export default App;
