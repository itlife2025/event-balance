import React, { createContext, useContext, useState, useEffect } from 'react';
import { type ThemeColors, lightColors, darkColors } from './colors';
import { getSetting, setSetting } from '../database/queries';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      const value = await getSetting('dark_mode_enabled');
      if (value === '1') setIsDark(true);
    })();
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      setSetting('dark_mode_enabled', next ? '1' : '0');
      return next;
    });
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
