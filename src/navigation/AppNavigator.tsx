import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/Home';
import SearchScreen from '../screens/Search';
import CollectionsScreen from '../screens/Collections';
import FavoritesScreen from '../screens/Favorites';
import SettingsScreen from '../screens/Settings';
import { RootTabParamList } from '../types/navigation';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigator(): React.JSX.Element {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'];

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Collections') {
            iconName = focused ? 'folder-open' : 'folder-open-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'star' : 'star-outline';
          } else {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8b5cf6', // brand-500
        tabBarInactiveTintColor: isDark ? '#a8a29e' : '#78716c',
        tabBarStyle: {
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          borderTopColor: isDark ? '#2e2a24' : '#e2e8f0',
          elevation: 5,
          shadowOpacity: 0.1,
          shadowRadius: 10,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: isDark ? '#f5f5f4' : '#0f172a',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'BrainDump' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ title: 'Global Search' }}
      />
      <Tab.Screen 
        name="Collections" 
        component={CollectionsScreen} 
        options={{ title: 'Library' }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ title: 'Favorites' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
