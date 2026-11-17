import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage, DARK_MODE_KEY } from '../utils/storage';

// Dark mode is applied as a `dark` class on <html>; components style
// themselves with Tailwind `dark:` variants and only read `darkMode` from
// here when they need it for something other than a class (e.g. an icon).

const ThemeContext = createContext(null);

const initialDarkMode = () => {
  const saved = storage.get(DARK_MODE_KEY);
  if (saved !== null) return saved === 'true';
  return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(initialDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    storage.set(DARK_MODE_KEY, String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
};
