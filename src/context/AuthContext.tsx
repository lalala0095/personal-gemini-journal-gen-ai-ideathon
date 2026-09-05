import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebaseClient';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  isFirebaseLive: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithSandbox: (name?: string, email?: string) => void;
  signOutUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local sandbox storage first
    const savedSandboxUser = localStorage.getItem('journal_sandbox_user');
    if (savedSandboxUser) {
      try {
        const parsed = JSON.parse(savedSandboxUser);
        setUser(parsed);
        setToken(parsed.uid);
      } catch (e) {
        localStorage.removeItem('journal_sandbox_user');
      }
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const userToken = await fbUser.getIdToken();
          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Journaler',
            photoURL: fbUser.photoURL || undefined
          };
          setUser(profile);
          setToken(userToken);
        } else if (!savedSandboxUser) {
          // If no sandbox user either, clear
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      // Prompt sandbox sign in if Firebase client not set
      signInWithSandbox('Google Explorer', 'user.explorer@gmail.com');
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userToken = await result.user.getIdToken();
      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'Journaler',
        photoURL: result.user.photoURL || undefined
      };
      setUser(profile);
      setToken(userToken);
      localStorage.removeItem('journal_sandbox_user');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const errMsg = err.code === 'auth/unauthorized-domain' 
        ? 'auth/unauthorized-domain: This domain is not authorized in your Firebase Console for Google OAuth.'
        : (err.message || 'Failed to sign in with Google.');
      setError(errMsg);
      throw err;
    }
  };

  const signInWithSandbox = (name = 'Security Architect', email = 'architect@security.corp') => {
    const sandboxUser: UserProfile = {
      uid: 'user_sb_' + Math.random().toString(36).substring(2, 9),
      email,
      displayName: name,
      isAnonymous: false
    };
    localStorage.setItem('journal_sandbox_user', JSON.stringify(sandboxUser));
    setUser(sandboxUser);
    setToken(sandboxUser.uid);
  };

  const signOutUser = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await fbSignOut(auth);
      }
      localStorage.removeItem('journal_sandbox_user');
      setUser(null);
      setToken(null);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        isFirebaseLive: isFirebaseConfigured,
        signInWithGoogle,
        signInWithSandbox,
        signOutUser,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
