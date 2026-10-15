import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured, firebaseMissingConfigError } from '../firebase/config';

const AuthContext = createContext(null);

/**
 * Maps Firebase Auth error codes to clear, user-friendly messages
 */
export const formatAuthError = (error) => {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'The email address entered is not valid.';
    case 'auth/weak-password':
      return 'The password is too weak. Please ensure it meets all complexity requirements.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connectivity.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact system support.';
    case 'auth/requires-recent-login':
      return 'This operation is sensitive and requires recent authentication. Please sign in again.';
    case 'auth/operation-not-allowed':
      return 'This authentication method is not enabled in Firebase Console. Please enable Email/Password or Google Sign-In in Firebase.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth operations. Add localhost to Authorized Domains in Firebase Console > Authentication > Settings.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured with environment variables, stop loading gracefully
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Subscribe to Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Email & Password Sign In
  const loginWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(firebaseMissingConfigError || 'Firebase credentials not configured.');
    }
    return signInWithEmailAndPassword(auth, email.trim(), password);
  };

  // Email & Password Registration
  const registerWithEmail = async (email, password, displayName) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(firebaseMissingConfigError || 'Firebase credentials not configured.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim() && userCredential.user) {
      try {
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
        });
        // Force refresh current user state with display name
        setCurrentUser({ ...userCredential.user, displayName: displayName.trim() });
      } catch (profileError) {
        console.warn('Failed to update user display name:', profileError);
      }
    }
    return userCredential;
  };

  // Google OAuth Sign In
  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error(firebaseMissingConfigError || 'Firebase credentials not configured.');
    }
    return signInWithPopup(auth, googleProvider);
  };

  // Password Reset Email
  const resetPassword = async (email) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(firebaseMissingConfigError || 'Firebase credentials not configured.');
    }
    return sendPasswordResetEmail(auth, email.trim());
  };

  // Secure Sign Out
  const logout = async () => {
    if (!auth) {
      setCurrentUser(null);
      return;
    }
    return signOut(auth);
  };

  // Update Profile (Display Name & Photo URL)
  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (auth && auth.currentUser) {
      const updates = {};
      if (displayName !== undefined) updates.displayName = displayName.trim();
      if (photoURL !== undefined) updates.photoURL = photoURL;

      await updateProfile(auth.currentUser, updates);
      setCurrentUser({
        ...auth.currentUser,
        ...updates,
      });
    }
  };

  // Delete User Account
  const deleteUserAccount = async () => {
    if (auth && auth.currentUser) {
      await deleteUser(auth.currentUser);
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    loading,
    isConfigured: isFirebaseConfigured,
    missingConfigError: firebaseMissingConfigError,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    logout,
    updateUserProfile,
    deleteUserAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
