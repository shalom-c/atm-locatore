import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <main className="auth-loading" role="status" aria-live="polite">
        Checking your account…
      </main>
    );
  }

  if (error) {
    return (
      <main className="auth-loading auth-error" role="alert">
        {error}
      </main>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
