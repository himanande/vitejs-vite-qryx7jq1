import { Component, StrictMode } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React Component:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#fef2f2', color: '#991b1b', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠️ 画面描画エラーが発生しました</h2>
          <p style={{ marginBottom: '1rem' }}>アプリのレンダリング中に例外が発生しました：</p>
          <pre style={{ background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto', fontSize: '0.85rem' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = window.location.pathname;
            }}
            style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', marginTop: '1.5rem', fontWeight: 'bold' }}
          >
            🔄 アプリを初期化・再起動する
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
  </StrictMode>,
)
