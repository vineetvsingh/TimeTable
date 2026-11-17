import React from 'react';
import AuthPage from './components/Auth/AuthPage';
import LoadingScreen from './components/Common/LoadingScreen';
import TimetableGenerator from './components/Timetable/TimetableGenerator';
import { FeedbackProvider, useFeedback } from './components/Common/Feedback';
import { ThemeProvider } from './context/ThemeContext';
import { TimetableProvider } from './context/TimetableContext';
import { useAuth } from './hooks/useAuth';

// Shows the loader while the session is checked, then either the sign-in page
// or the timetable app for the signed-in user.
const AuthGate = () => {
  const { notify } = useFeedback();
  const auth = useAuth({ notify });
  const { currentUser, authLoading, handleLogout } = auth;

  if (authLoading) return <LoadingScreen />;

  if (!currentUser) {
    return (
      <AuthPage
        isLogin={auth.isLogin}
        setIsLogin={auth.setIsLogin}
        formData={auth.formData}
        handleInputChange={auth.handleInputChange}
        handleAuthSubmit={auth.handleAuthSubmit}
        handleGoogleLogin={auth.handleGoogleLogin}
        authErrors={auth.authErrors}
        authLoading={auth.authSubmitting}
        showPassword={auth.showPassword}
        setShowPassword={auth.setShowPassword}
        handlePasswordReset={auth.handlePasswordReset}
      />
    );
  }

  return (
    // Keyed by user so a different account never sees the previous one's state.
    <TimetableProvider key={currentUser.uid} user={currentUser}>
      <TimetableGenerator currentUser={currentUser} onLogout={handleLogout} />
    </TimetableProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <FeedbackProvider>
      <AuthGate />
    </FeedbackProvider>
  </ThemeProvider>
);

export default App;
