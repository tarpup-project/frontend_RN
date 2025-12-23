import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export function useTheme() {
  const deviceTheme = useColorScheme(); // auto-detects device
  const [userTheme, setUserTheme] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(setUserTheme);
  }, []);

  const saveTheme = async (theme: 'light' | 'dark') => {
    await AsyncStorage.setItem('theme', theme);
    setUserTheme(theme);
  };

  const theme = userTheme || deviceTheme || 'light';

  return { theme, saveTheme };
}