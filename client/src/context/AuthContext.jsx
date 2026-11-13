import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase.js';
import { signOut } from '../lib/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    let stopProfileListener;

    const stopAuthListener = onAuthStateChanged(auth, (currentUser) => {
      const currentRequestId = ++requestId.current;
      if (stopProfileListener) stopProfileListener();
      stopProfileListener = undefined;

      setUser(currentUser);
      setProfile(null);
      setError('');

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      stopProfileListener = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (snapshot) => {
          if (requestId.current !== currentRequestId) return;
          setProfile(snapshot.exists() ? snapshot.data() : null);
          setLoading(false);
        },
        (profileError) => {
          if (requestId.current !== currentRequestId) return;
          setError(`Unable to load your account profile: ${profileError.message}`);
          setLoading(false);
        },
      );
    });

    return () => {
      requestId.current += 1;
      stopAuthListener();
      if (stopProfileListener) stopProfileListener();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    error,
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
