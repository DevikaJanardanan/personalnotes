import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY } from '../api/client';
import { authApi } from '../api/notes';

const AuthContext = createContext(null);

/**
 * Keeps track of who is logged in.
 * The JWT is stored in localStorage so the user stays logged in after a refresh;
 * on start-up we call GET /api/auth/me to check the token is still valid.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // Restore the session on page load
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setChecking(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(logout)
      .finally(() => setChecking(false));
  }, [logout]);

  // The Axios interceptor fires this event when the server says 401
  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const saveSession = ({ token, user: u }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  };

  const login = useCallback((email, password) => authApi.login({ email, password }).then(saveSession), []);
  const register = useCallback((name, email, password) => authApi.register({ name, email, password }).then(saveSession), []);

  // Used after the lock password is set, so the app knows locking is available
  const updateUser = useCallback((u) => setUser(u), []);

  const value = useMemo(
    () => ({ user, checking, login, register, logout, updateUser }),
    [user, checking, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
