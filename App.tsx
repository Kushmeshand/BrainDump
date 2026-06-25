import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { CustomLightTheme, CustomDarkTheme } from './src/store/themeStore';
import { useColorScheme } from 'nativewind';
import { useAutoTheme } from './src/hooks/useAutoTheme';
import { subscribeToNotes } from './src/services/notes';
import { subscribeToLinks } from './src/services/links';
import { subscribeToCollections } from './src/services/collections';

export default function App() {
  // Sync core styling theme with nativewind engine
  useAutoTheme();

  React.useEffect(() => {
    const unsubscribeNotes = subscribeToNotes();
    const unsubscribeLinks = subscribeToLinks();
    const unsubscribeCollections = subscribeToCollections();
    return () => {
      unsubscribeNotes();
      unsubscribeLinks();
      unsubscribeCollections();
    };
  }, []);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigationTheme = isDark ? CustomDarkTheme : CustomLightTheme;

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
