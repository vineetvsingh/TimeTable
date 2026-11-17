import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { storage, draftKey } from '../utils/storage';

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '' };

const fallbackName = (user) =>
  user.displayName || (user.email ? user.email.split('@')[0] : 'User');

// Read the user's display name from Firestore, falling back to the auth profile
// if the document is missing or unreadable (e.g. sign-up doc write failed).
const loadProfileName = async (user) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().name) return userDoc.data().name;
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
  return null;
};

const saveProfile = async (user, name) => {
  try {
    await setDoc(doc(db, 'users', user.uid), { name, email: user.email, createdAt: serverTimestamp() });
  } catch (error) {
    // The account exists either way; a failed profile write shouldn't block sign-in.
    console.error('Error saving user profile:', error);
  }
};

const authErrorMessage = (code) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Email already in use';
    case 'auth/invalid-email': return 'Invalid email';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password';
    case 'auth/weak-password': return 'Password is too weak';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default: return 'Authentication failed';
  }
};

const resetErrorMessage = (code) => {
  switch (code) {
    case 'auth/user-not-found': return 'No user found with this email address.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/too-many-requests': return 'Too many requests. Please try again later.';
    default: return 'Failed to send reset email.';
  }
};

/**
 * Sign-in state and the login/register/reset forms.
 * `currentUser` is { uid, email, name } once signed in, otherwise null.
 */
export const useAuth = ({ notify }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // authLoading: initial session check (shows the full-screen loader).
  // authSubmitting: a form action is in flight (keeps the auth page mounted).
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [isLogin, setIsLoginState] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [authErrors, setAuthErrors] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const name = await loadProfileName(user);
        setCurrentUser(prev => {
          // During sign-up the profile doc may not exist yet; keep the name the
          // sign-up handler already set instead of overwriting it.
          if (!name && prev?.uid === user.uid && prev.name) return prev;
          return { uid: user.uid, email: user.email, name: name || fallbackName(user) };
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const validate = () => {
    const errors = {};
    if (!isLogin && !formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!isLogin && formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setAuthErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setAuthSubmitting(true);
    try {
      const email = formData.email.trim();
      if (isLogin) {
        const { user } = await signInWithEmailAndPassword(auth, email, formData.password);
        const name = await loadProfileName(user);
        setCurrentUser({ uid: user.uid, email: user.email, name: name || fallbackName(user) });
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, formData.password);
        const name = formData.name.trim();
        setCurrentUser({ uid: user.uid, email: user.email, name });
        await saveProfile(user, name);
      }
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      console.error('Auth error:', error);
      setAuthErrors({ email: authErrorMessage(error.code) });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthSubmitting(true);
    setAuthErrors({});
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      let name = await loadProfileName(user);
      if (!name) {
        name = fallbackName(user);
        await saveProfile(user, name);
      }
      setCurrentUser({ uid: user.uid, email: user.email, name });
    } catch (error) {
      // The user closing the popup is not an error worth reporting.
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') return;
      console.error('Google Auth error:', error);
      setAuthErrors({
        google: error.code === 'auth/popup-blocked'
          ? 'Popup was blocked. Please allow popups for this site and try again.'
          : 'Google Sign-In failed. Please try again.'
      });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (authErrors[name]) setAuthErrors(prev => ({ ...prev, [name]: '' }));
  };

  const setIsLogin = (value) => {
    setIsLoginState(value);
    setAuthErrors({});
  };

  const handlePasswordReset = async (email) => {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      notify('Please enter your email address first.', 'error');
      return false;
    }
    setAuthSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      notify('If an account exists for this email, a password reset link has been sent. Check your inbox (and spam folder).', 'success');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      notify(resetErrorMessage(error.code), 'error');
      return false;
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Drop this user's in-progress draft so it isn't left on a shared device.
      if (currentUser) storage.remove(draftKey(currentUser.uid));
      await signOut(auth);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setCurrentUser(null);
      setFormData(EMPTY_FORM);
      setAuthErrors({});
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    currentUser,
    authLoading,
    authSubmitting,
    isLogin,
    setIsLogin,
    showPassword,
    setShowPassword,
    formData,
    authErrors,
    handleInputChange,
    handleAuthSubmit,
    handleGoogleLogin,
    handlePasswordReset,
    handleLogout
  };
};
