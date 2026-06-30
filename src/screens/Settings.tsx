import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useThemeStore, ThemeType } from '../store/themeStore';
import { logout } from '../services/auth';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(newTheme);
    }
  };

  console.log('Settings screen rendered');
  console.log('Settings sections created');
  console.log('Settings items rendered');

  return (
    <View style={{ flex: 1 }} className="bg-stone-50 dark:bg-stone-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }} style={{ flex: 1 }} className="px-4">
        
        {/* Account Section */}
        <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2.5 px-1">Account</Text>
        <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-6">
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#8b5cf6" />
              <Text className="text-stone-700 dark:text-stone-200 font-semibold ml-3.5">Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#a8a29e" />
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2.5 px-1">Appearance</Text>
        <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-6">
          {(['light', 'dark', 'system'] as ThemeType[]).map((mode, index) => {
            const isSelected = theme === mode;
            const label = mode.charAt(0).toUpperCase() + mode.slice(1);
            let icon: keyof typeof Ionicons.glyphMap = 'sunny-outline';
            if (mode === 'dark') icon = 'moon-outline';
            if (mode === 'system') icon = 'phone-portrait-outline';

            return (
              <TouchableOpacity
                key={mode}
                onPress={() => handleThemeChange(mode)}
                className={`flex-row items-center justify-between p-4 ${
                  index !== 2 ? 'border-b border-stone-50 dark:border-stone-850' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons name={icon as any} size={20} color={isSelected ? '#8b5cf6' : '#78716c'} />
                  <Text className={`font-semibold ml-3.5 ${isSelected ? 'text-brand-500' : 'text-stone-700 dark:text-stone-200'}`}>
                    {label}
                  </Text>
                </View>
                {isSelected && <Ionicons name="checkmark" size={20} color="#8b5cf6" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AI Section */}
        <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2.5 px-1">AI</Text>
        <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-6">
          <View className="flex-row items-center justify-between p-4 opacity-50">
            <View className="flex-row items-center">
              <Ionicons name="hardware-chip-outline" size={20} color="#78716c" />
              <Text className="text-stone-700 dark:text-stone-200 font-semibold ml-3.5">AI Provider</Text>
            </View>
            <Text className="text-stone-400 text-xs font-bold uppercase">Coming Soon</Text>
          </View>
        </View>

        {/* General Section */}
        <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2.5 px-1">General</Text>
        <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-6">
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={20} color="#78716c" />
              <Text className="text-stone-700 dark:text-stone-200 font-semibold ml-3.5">About</Text>
            </View>
            <Text className="text-stone-400 font-medium">Version 1.0.0</Text>
          </View>
        </View>

        {/* Authentication Section */}
        <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2.5 px-1">Authentication</Text>
        <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-12">
          <TouchableOpacity
            onPress={() => logout()}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="font-semibold ml-3.5 text-red-500">Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#a8a29e" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
