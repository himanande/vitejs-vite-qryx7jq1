import './LoadingScreen.css';

export function LoadingScreen({ message = '読み込み中…' }: { message?: string }) {
  return (
    <div className="loading-screen" role="status">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
