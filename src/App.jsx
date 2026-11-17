import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { Users, Calendar, User, Clock, AlertCircle } from 'lucide-react';

import AuthPage from './components/Auth/AuthPage';
import LoadingScreen from './components/Common/LoadingScreen';
import TimetableGenerator from './components/Timetable/TimetableGenerator';
import { greedyScheduler, detectConflicts, sortTimeSlots } from './utils/scheduler';

const EMPTY_ACTIVITY = {
  name: '',
  duration: 1,
  priority: 'medium',
  preferredDays: [],
  preferredTimes: [],
  avoidTimes: [],
  instructor: '',
  room: '',
  color: 'blue',
  description: '',
  recurring: false
};

const EMPTY_TIMETABLE = {
  name: '',
  timeSlots: [],
  activities: [],
  constraints: []
};

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

const IntegratedTimetableApp = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  // authLoading: initial session check (shows full-screen loader).
  // authSubmitting: a form action is in flight (keeps the auth page mounted).
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [authErrors, setAuthErrors] = useState({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Timetable Generator State
  const [currentStep, setCurrentStep] = useState(1);
  const [timetableType, setTimetableType] = useState('');
  const [timetableData, setTimetableData] = useState(EMPTY_TIMETABLE);
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [optimizationSettings, setOptimizationSettings] = useState({
    prioritizePreferences: true,
    minimizeGaps: true,
    balanceWorkload: true
  });

  const [currentActivity, setCurrentActivity] = useState(EMPTY_ACTIVITY);

  // Saved Timetables State
  const [savedTimetables, setSavedTimetables] = useState([]);

  // Constants
  const timetableTypes = [
    {
      id: 'school',
      name: 'School Schedule',
      icon: <Users className="w-6 h-6" />,
      description: 'Class schedules, subjects, and periods',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      id: 'college',
      name: 'College Schedule',
      icon: <Calendar className="w-6 h-6" />,
      description: 'Lectures, labs, and study sessions',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      id: 'personal',
      name: 'Personal Schedule',
      icon: <User className="w-6 h-6" />,
      description: 'Daily routines and personal activities',
      gradient: 'from-green-400 to-green-600'
    },
    {
      id: 'work',
      name: 'Work Schedule',
      icon: <Clock className="w-6 h-6" />,
      description: 'Shift schedules and work planning',
      gradient: 'from-orange-400 to-orange-600'
    }
  ];

  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const priorityLevels = ['high', 'medium', 'low'];
  const colors = [
    { name: 'blue', light: 'bg-blue-200', dark: 'bg-blue-700', border: 'border-blue-400' },
    { name: 'green', light: 'bg-green-200', dark: 'bg-green-700', border: 'border-green-400' },
    { name: 'purple', light: 'bg-purple-200', dark: 'bg-purple-700', border: 'border-purple-400' },
    { name: 'yellow', light: 'bg-yellow-200', dark: 'bg-yellow-700', border: 'border-yellow-400' },
    { name: 'pink', light: 'bg-pink-200', dark: 'bg-pink-700', border: 'border-pink-400' },
    { name: 'indigo', light: 'bg-indigo-200', dark: 'bg-indigo-700', border: 'border-indigo-400' },
    { name: 'red', light: 'bg-red-200', dark: 'bg-red-700', border: 'border-red-400' },
    { name: 'orange', light: 'bg-orange-200', dark: 'bg-orange-700', border: 'border-orange-400' }
  ];

  const flashSuccess = (ms) => {
    setShowSuccessAnimation(true);
    setTimeout(() => setShowSuccessAnimation(false), ms);
  };

  // Effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auth Functions
  const validateAuthForm = () => {
    const newErrors = {};
    if (!isLogin && !formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!isLogin && formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setAuthErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!validateAuthForm()) return;

    try {
      setAuthSubmitting(true);
      if (isLogin) {
        const { user } = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const name = await loadProfileName(user);
        setCurrentUser({ uid: user.uid, email: user.email, name: name || fallbackName(user) });
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const name = formData.name.trim();
        setCurrentUser({ uid: user.uid, email: user.email, name });
        try {
          await setDoc(doc(db, 'users', user.uid), {
            name,
            email: user.email,
            createdAt: serverTimestamp()
          });
        } catch (profileError) {
          // The account was created; a failed profile write shouldn't block sign-in.
          console.error('Error saving user profile:', profileError);
        }
      }
      setIsAuthenticated(true);
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      flashSuccess(1000);
    } catch (error) {
      console.error('Auth error:', error);
      setAuthErrors({ email: authErrorMessage(error.code) });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthSubmitting(true);
      setAuthErrors({});
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      let name = await loadProfileName(user);
      if (!name) {
        name = fallbackName(user);
        try {
          await setDoc(doc(db, 'users', user.uid), {
            name,
            email: user.email,
            createdAt: serverTimestamp()
          });
        } catch (profileError) {
          console.error('Error saving user profile:', profileError);
        }
      }

      setCurrentUser({ uid: user.uid, email: user.email, name });
      setIsAuthenticated(true);
      flashSuccess(1000);
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

  const handleSetIsLogin = (value) => {
    setIsLogin(value);
    setAuthErrors({});
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setSavedTimetables([]);
      resetGenerator();
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setAuthErrors({});
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePasswordReset = async (email) => {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      alert('Please enter your email address first.');
      return false;
    }
    try {
      setAuthSubmitting(true);
      await sendPasswordResetEmail(auth, trimmed);
      alert('If an account exists for this email, a password reset link has been sent. Check your inbox (and spam folder).');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      alert(errorMessage);
      return false;
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Timetable Functions
  const handleTypeSelection = (type) => {
    setTimetableType(type);
    setCurrentStep(2);
    flashSuccess(500);
  };

  const addTimeSlot = (slot) => {
    setTimetableData(prev => (
      prev.timeSlots.includes(slot)
        ? prev
        : { ...prev, timeSlots: sortTimeSlots([...prev.timeSlots, slot]) }
    ));
  };

  const removeTimeSlot = (slot) => {
    setTimetableData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(s => s !== slot)
    }));
  };

  const addActivity = () => {
    if (currentActivity.name.trim() && currentActivity.duration) {
      const colorObj = colors.find(c => c.name === currentActivity.color) || colors[0];
      const newActivity = {
        ...currentActivity,
        name: currentActivity.name.trim(),
        id: Date.now() + Math.random(),
        colorLight: colorObj.light,
        colorDark: colorObj.dark,
        borderColor: colorObj.border
      };
      setTimetableData(prev => ({
        ...prev,
        activities: [...prev.activities, newActivity]
      }));
      setCurrentActivity(EMPTY_ACTIVITY);
    }
  };

  const removeActivity = (id) => {
    setTimetableData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id)
    }));
  };

  const togglePreference = (type, value) => {
    setCurrentActivity(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const generateTimetable = () => {
    let workingDays;
    switch (timetableType) {
      case 'work':
        workingDays = days.slice(0, 6);
        break;
      case 'personal':
        workingDays = days;
        break;
      case 'school':
      case 'college':
      default:
        workingDays = days.slice(0, 5);
    }

    const generated = greedyScheduler(
      timetableData.activities,
      timetableData.timeSlots,
      workingDays,
      optimizationSettings
    );

    setGeneratedTimetable(generated);
    setConflicts(detectConflicts(generated, timetableData.activities, timetableData.timeSlots));
    setCurrentStep(4);
    flashSuccess(1000);
  };

  const regenerateTimetable = () => {
    generateTimetable();
  };

  const resetGenerator = () => {
    setCurrentStep(1);
    setTimetableType('');
    setTimetableData(EMPTY_TIMETABLE);
    setCurrentActivity(EMPTY_ACTIVITY);
    setGeneratedTimetable(null);
    setConflicts([]);
  };

  const getConflictIcon = (day, slot) => {
    const hasConflict = conflicts.some(conflict => conflict.day === day && conflict.time === slot);
    return hasConflict ? <AlertCircle className="w-4 h-4 text-red-500 ml-1 animate-pulse" /> : null;
  };

  const exportTimetable = () => {
    const exportData = {
      name: timetableData.name,
      type: timetableType,
      schedule: generatedTimetable,
      activities: timetableData.activities,
      timeSlots: timetableData.timeSlots,
      exportedAt: new Date().toISOString()
    };

    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safeName = (timetableData.name || 'timetable').replace(/[^a-z0-9-_ ]/gi, '_').trim() || 'timetable';

      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = `${safeName}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting timetable:', error);
      alert('Error exporting timetable. Please try again.');
    }
  };

  // Saved Timetables Functions
  const currentUid = currentUser?.uid;
  const fetchSavedTimetables = useCallback(async () => {
    if (!currentUid) return;

    try {
      const q = query(
        collection(db, 'timetables'),
        where('userId', '==', currentUid)
      );
      const querySnapshot = await getDocs(q);
      const timetables = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client-side to avoid Firestore index requirements
      timetables.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setSavedTimetables(timetables);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    }
  }, [currentUid]);

  // Fetch saved timetables when the signed-in user changes
  useEffect(() => {
    fetchSavedTimetables();
  }, [fetchSavedTimetables]);

  const loadTimetable = (timetable) => {
    const loadedData = {
      name: timetable.name || '',
      timeSlots: timetable.timeSlots || [],
      activities: timetable.activities || [],
      constraints: []
    };
    setTimetableType(timetable.type || '');
    setTimetableData(loadedData);
    setGeneratedTimetable(timetable.schedule || {});
    setConflicts(detectConflicts(timetable.schedule || {}, loadedData.activities, loadedData.timeSlots));
    setCurrentStep(4);
  };

  const deleteTimetable = async (id) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;

    try {
      await deleteDoc(doc(db, 'timetables', id));
      setSavedTimetables(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting timetable:', error);
      alert('Failed to delete timetable.');
    }
  };

  const saveTimetable = async () => {
    if (!currentUser || !generatedTimetable) return;

    const saveData = {
      name: timetableData.name,
      type: timetableType,
      schedule: generatedTimetable,
      activities: timetableData.activities,
      timeSlots: timetableData.timeSlots,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'timetables'), saveData);
      alert('Timetable saved to cloud successfully!');
      fetchSavedTimetables();
    } catch (error) {
      console.error('Error saving to cloud:', error);
      alert('Failed to save to cloud. Please check your internet connection.');
    }
  };

  if (authLoading) {
    return <LoadingScreen darkMode={darkMode} />;
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <AuthPage
        isLogin={isLogin}
        setIsLogin={handleSetIsLogin}
        formData={formData}
        handleInputChange={handleInputChange}
        handleAuthSubmit={handleAuthSubmit}
        handleGoogleLogin={handleGoogleLogin}
        authErrors={authErrors}
        authLoading={authSubmitting}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showSuccessAnimation={showSuccessAnimation}
        handlePasswordReset={handlePasswordReset}
      />
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <TimetableGenerator
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        showSuccessAnimation={showSuccessAnimation}
        timetableData={timetableData}
        setTimetableData={setTimetableData}
        currentActivity={currentActivity}
        setCurrentActivity={setCurrentActivity}
        generatedTimetable={generatedTimetable}
        conflicts={conflicts}
        optimizationSettings={optimizationSettings}
        setOptimizationSettings={setOptimizationSettings}
        handleTypeSelection={handleTypeSelection}
        addTimeSlot={addTimeSlot}
        removeTimeSlot={removeTimeSlot}
        addActivity={addActivity}
        removeActivity={removeActivity}
        togglePreference={togglePreference}
        generateTimetable={generateTimetable}
        regenerateTimetable={regenerateTimetable}
        exportTimetable={exportTimetable}
        saveTimetable={saveTimetable}
        resetGenerator={resetGenerator}
        getConflictIcon={getConflictIcon}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        handleLogout={handleLogout}
        timetableTypes={timetableTypes}
        timeSlots={timeSlots}
        priorityLevels={priorityLevels}
        colors={colors}
        days={days}
        savedTimetables={savedTimetables}
        loadTimetable={loadTimetable}
        deleteTimetable={deleteTimetable}
        fetchSavedTimetables={fetchSavedTimetables}
      />
    </div>
  );
};

export default IntegratedTimetableApp;
