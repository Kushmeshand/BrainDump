import { create } from 'zustand';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}));

export const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#8b5cf6', // brand-500
    background: '#f5f3ff', // brand-50
    card: '#ffffff',
    text: '#0f172a', // slate-900
    border: '#e2e8f0', // slate-200
    notification: '#ef4444',
  },
};

export const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#a78bfa', // brand-400
    background: '#0c0a09', // stone-950
    card: '#1c1917', // stone-900
    text: '#f5f5f4', // stone-100
    border: '#2c2a24',
    notification: '#ef4444',
  },
};
