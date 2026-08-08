import { Component, StrictMode } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface State {
  error: Error | null;
}

class ErrorBoundary extends Component<{ children?: ReactNode }, State> {
  public state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component:', error, errorInfo);
  }

  public render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2>⚠️ 画面描画エラーが発生しました</h2>
          <pre
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflowX: 'auto',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {this.state.error.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              marginTop: '1rem',
              cursor: 'pointer',
            }}
          >
            🔄 再読み込み
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
