import { useCallback, useEffect, useState } from 'react';
import './Dashboard.css';
import type { Category, MyStats, UserProfile } from '../../types/db';
import { fetchCategories, fetchMyStats } from '../../lib/quizApi';
import { FREE_DAILY_LIMIT } from '../../lib/constants';
import { LoadingScreen } from '../common/LoadingScreen';
import { ErrorScreen } from '../common/ErrorScreen';

interface Props {
  profile: UserProfile | null;
  displayName: string;
  onStartThemeMode: (category: Category) => void;
  onStartCategoryQuiz: (categories: Category[]) => void;
  onStartAllQuiz: () => void;
  onSignOut: () => void;
}

export function Dashboard({
  profile,
  displayName,
  onStartThemeMode,
  onStartCategoryQuiz,
  onStartAllQuiz,
  onSignOut,
}: Props) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [cats, myStats] = await Promise.all([fetchCategories(), fetchMyStats()]);
      setCategories(cats);
      setStats(myStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorScreen message={error} onRetry={() => void load()} />;
  if (!categories || !stats) return <LoadingScreen />;

  const accuracy =
    stats.total_answered === 0
      ? null
      : Math.round((stats.total_correct / stats.total_answered) * 100);
  const isPremium = stats.is_premium;

  const toggleCategory = (id: number) => {
    setCheckedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  };

  return (
    <div className="screen dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">🏯 京都検定 3 級 問題集</h1>
        <div className="dashboard-user">
          <span>{displayName}</span>
          {isPremium && <span className="dashboard-premium-badge">プレミアム</span>}
          <button className="btn-text" onClick={onSignOut}>
            ログアウト
          </button>
        </div>
      </header>

      <section className="card dashboard-stats">
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{stats.total_answered}</span>
          <span className="dashboard-stat-label">累計回答数</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">
            {accuracy === null ? '—' : `${accuracy}%`}
          </span>
          <span className="dashboard-stat-label">正答率</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">
            {isPremium ? '∞' : `${stats.remaining_today}`}
          </span>
          <span className="dashboard-stat-label">
            {isPremium ? '本日の残り' : `本日の残り / ${FREE_DAILY_LIMIT}問`}
          </span>
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">テーマ別演習</h2>
        <p className="dashboard-section-note">カテゴリを選んでテーマごとに学習</p>
        <div className="dashboard-category-grid">
          {categories.map((c) => (
            <button
              key={c.id}
              className="card dashboard-category-card"
              onClick={() => onStartThemeMode(c)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">カテゴリ別演習</h2>
        <p className="dashboard-section-note">複数カテゴリをまとめて演習</p>
        <div className="card dashboard-checkboxes">
          {categories.map((c) => (
            <label key={c.id} className="dashboard-checkbox">
              <input
                type="checkbox"
                checked={checkedIds.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
              />
              {c.name}
            </label>
          ))}
          <button
            className="btn-primary"
            disabled={checkedIds.length === 0}
            onClick={() =>
              onStartCategoryQuiz(categories.filter((c) => checkedIds.includes(c.id)))
            }
          >
            選択したカテゴリで演習する
          </button>
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">総合演習</h2>
        <button className="btn-secondary" onClick={onStartAllQuiz}>
          全問題からランダム出題
        </button>
      </section>

      {profile === null && (
        <p className="dashboard-profile-warning">
          ⚠️ プロフィールを取得できませんでした。docs/migration_v2.sql が
          Supabase に適用済みか確認してください。
        </p>
      )}
    </div>
  );
}
