import { useCallback, useEffect, useState } from 'react';
import './ThemeSelector.css';
import type { Category, Theme } from '../../types/db';
import { fetchThemesWithCounts } from '../../lib/quizApi';
import { LoadingScreen } from '../common/LoadingScreen';
import { ErrorScreen } from '../common/ErrorScreen';

interface Props {
  category: Category;
  onSelectTheme: (theme: Theme) => void;
  onBack: () => void;
}

export function ThemeSelector({ category, onSelectTheme, onBack }: Props) {
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setThemes(await fetchThemesWithCounts(category.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [category.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorScreen message={error} onRetry={() => void load()} onBack={onBack} />;
  if (!themes) return <LoadingScreen />;

  return (
    <div className="screen theme-selector">
      <button className="btn-text theme-selector-back" onClick={onBack}>
        ← ダッシュボードへ戻る
      </button>
      <h1 className="theme-selector-title">{category.name}</h1>
      {category.description && (
        <p className="theme-selector-description">{category.description}</p>
      )}

      {themes.length === 0 ? (
        <p className="theme-selector-empty">
          このカテゴリには出題可能なテーマがまだありません。
        </p>
      ) : (
        <div className="theme-selector-list">
          {themes.map((t) => (
            <button
              key={t.id}
              className="card theme-selector-item"
              onClick={() => onSelectTheme(t)}
            >
              <span className="theme-selector-item-name">{t.name}</span>
              <span className="theme-selector-item-count">{t.question_count}問</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
