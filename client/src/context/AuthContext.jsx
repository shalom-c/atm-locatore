import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { signOut } from '../lib/auth.js';

const AuthContext = createContext(null);
const AUTH_CACHE_KEY = 'zuru-atm-locator-user';
const AUTH_TIMEOUT_MS = 8000;

function readCachedUser() {
  try {
    const cached = JSON.parse(localStorage.getItem(AUTH_CACHE_KEY) || 'null');
    return cached && typeof cached.uid === 'string'
      ? { uid: cached.uid, displayName: String(cached.displayName || '') }
      : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user) {
  try {
    if (user) {
      localStorage.setItem(
        AUTH_CACHE_KEY,
        JSON.stringify({ uid: user.uid, displayName: user.displayName || '' }),
      );
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    // Auth continues to work when browser storage is unavailable.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);
  const [profile, setProfile] = useState(() => {
    const cachedUser = readCachedUser();
    return cachedUser?.displayName ? { displayName: cachedUser.displayName } : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    let completed = false;
    let disposed = false;
    let stopAuthListener;
    const timeoutId = setTimeout(() => {
      if (requestId.current !== currentRequestId || completed) return;
      completed = true;
      setLoading(false);
      setError('Account verification is taking longer than expected. Check your connection and retry.');
    }, AUTH_TIMEOUT_MS);

    function finish() {
      completed = true;
      clearTimeout(timeoutId);
      setLoading(false);
    }

    import('../lib/authClient.js')
      .then(({ auth, onAuthStateChanged }) => {
        if (disposed || requestId.current !== currentRequestId) return;
        stopAuthListener = onAuthStateChanged(
          auth,
          (currentUser) => {
            if (requestId.current !== currentRequestId) return;
            finish();
            setUser(currentUser);
            writeCachedUser(currentUser);
            setProfile(
              currentUser?.displayName
                ? { displayName: currentUser.displayName }
                : null,
            );
            setError('');
            if (currentUser) {
              import('../lib/firebase.js')
                .then(({ db }) =>
                  import('firebase/firestore').then(({ doc, getDoc }) =>
                    getDoc(doc(db, 'users', currentUser.uid)),
                  ),
                )
                .then((snapshot) => {
                  if (auth.currentUser?.uid !== currentUser.uid) return;
                  const profileData = snapshot.exists() ? snapshot.data() : null;
                  setProfile(profileData);
                  writeCachedUser({
                    uid: currentUser.uid,
                    displayName: currentUser.displayName || profileData?.displayName || '',
                  });
                })
                .catch((profileError) => {
                  if (auth.currentUser?.uid !== currentUser.uid) return;
                  setError(`Unable to load your account profile: ${profileError.message}`);
                });
            } else {
              setProfile(null);
            }
          },
          (authError) => {
            if (requestId.current !== currentRequestId) return;
            finish();
            setError(`Unable to verify your account: ${authError.message}`);
          },
        );
      })
      .catch((authError) => {
        if (disposed || requestId.current !== currentRequestId) return;
        finish();
        setError(`Unable to load account verification: ${authError.message}`);
      });

    return () => {
      disposed = true;
      requestId.current += 1;
      clearTimeout(timeoutId);
      if (stopAuthListener) stopAuthListener();
    };
  }, [retryCount]);

  function retryAuth() {
    setError('');
    setLoading(true);
    setRetryCount((count) => count + 1);
  }

  const value = {
    user,
    profile,
    loading,
    error,
    retryAuth,
    logout: signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
