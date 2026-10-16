import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Only renders its children for logged-in users.
 * Guests are redirected to /login (and sent back here after logging in).
 */
export default function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div className="page-loader">
        <span className="spinner" /> Opening your notebook…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
}

/** The opposite: logged-in users who open /login or /register go straight to their notes. */
export function GuestRoute({ children }) {
  const { user, checking } = useAuth();
  if (checking) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}
