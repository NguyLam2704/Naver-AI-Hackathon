import { useState, useEffect } from 'react';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('themeMode') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  return 'light';
};

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prevMode => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  return { themeMode, toggleTheme };
};