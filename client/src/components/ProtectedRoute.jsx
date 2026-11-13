import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function AuthLoadingShell({ error, onRetry }) {
  return (
    <main className="auth-loading-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">Z</div>
        <div>
          <p className="eyebrow">Kebbi State, Nigeria</p>
          <h1>ATM Locator</h1>
          <p className="intro">Find an ATM near you in Zuru.</p>
        </div>
        <span className="skeleton skeleton-account" aria-hidden="true" />
      </header>
      {error ? (
        <div className="auth-retry-message" role="alert">
          <span>{error}</span>
          <button className="button button-primary" type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : (
        <p className="auth-loading-message" role="status" aria-live="polite">
          Restoring your account…
        </p>
      )}
      <div className="skeleton skeleton-controls" aria-hidden="true" />
      <div className="skeleton-workspace" aria-hidden="true">
        <div className="skeleton skeleton-map" />
        <div className="skeleton skeleton-results" />
      </div>
    </main>
  );
}

export default function ProtectedRoute() {
  const { user, loading, error, retryAuth } = useAuth();

  if (!user && (loading || error)) {
    return <AuthLoadingShell error={error} onRetry={retryAuth} />;
  }

  if (user) return <Outlet />;
  return <Navigate to="/login" replace />;
}
