import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useTheme() {
  const deviceTheme = useColorScheme(); // auto-detects device
  const [userTheme, setUserTheme] = useState(null);

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