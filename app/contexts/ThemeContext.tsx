import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  resetToSystem: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemTheme = useColorScheme() || 'light';
  const [manualTheme, setManualTheme] = useState<Theme | null>(null);

  const theme: Theme = manualTheme || systemTheme;
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setManualTheme(isDark ? 'light' : 'dark');
  };

  const resetToSystem = () => {
    setManualTheme(null);
  };


  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    resetToSystem,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};