import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '../store/themeStore';

export function useAutoTheme() {
  const { theme } = useThemeStore();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (theme === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(theme);
    }
  }, [theme]);
}
