import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useThemeStore, ThemeType } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/auth';

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(newTheme);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50 dark:bg-stone-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }} className="flex-1 px-4">
      {/* Profile Section */}
      <View className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-850 flex-row items-center mb-6 shadow-sm">
        <View className="w-14 h-14 rounded-full bg-brand-500 items-center justify-center mr-4">
          <Text className="text-white text-xl font-bold">{getInitials(user?.displayName || null)}</Text>
        </View>
        <View>
          <Text className="text-stone-800 dark:text-stone-100 font-extrabold text-lg">{user?.displayName || 'BrainDumper'}</Text>
          <Text className="text-stone-400 dark:text-stone-500 text-sm">{user?.email || 'user@braindump.io'}</Text>
        </View>
      </View>

      {/* Account Section */}
      <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2.5 px-1">Account</Text>
      <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-6">
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

      {/* Section Theme Selection */}
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

      {/* Feature Flags / Options */}
      <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2.5 px-1">Feature Sync (Future)</Text>
      <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-6">
        <View className="flex-row items-center justify-between p-4 border-b border-stone-50 dark:border-stone-850">
          <View className="flex-row items-center">
            <Ionicons name="cloud-offline-outline" size={20} color="#78716c" />
            <Text className="text-stone-700 dark:text-stone-200 font-semibold ml-3.5">Firebase Cloud Sync</Text>
          </View>
          <Switch value={false} disabled={true} />
        </View>

        <View className="flex-row items-center justify-between p-4 border-b border-stone-50 dark:border-stone-850">
          <View className="flex-row items-center">
            <Ionicons name="sparkles-outline" size={20} color="#78716c" />
            <Text className="text-stone-700 dark:text-stone-200 font-semibold ml-3.5">Auto Tagging (AI)</Text>
          </View>
          <Switch value={true} />
        </View>

        <View className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center">
            <Ionicons name="scan-outline" size={20} color="#78716c" />
            <Text className="text-stone-700 dark:text-stone-200 font-semibold ml-3.5">Screen OCR Search</Text>
          </View>
          <Switch value={true} />
        </View>
      </View>

      {/* Info Section */}
      <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2.5 px-1">About</Text>
      <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-12">
        <View className="flex-row justify-between p-4 border-b border-stone-50 dark:border-stone-850">
          <Text className="text-stone-600 dark:text-stone-300 font-medium">App Version</Text>
          <Text className="text-stone-400 dark:text-stone-500">1.0.0 (Expo Foundation)</Text>
        </View>
        <View className="flex-row justify-between p-4">
          <Text className="text-stone-600 dark:text-stone-300 font-medium">Firebase Integration</Text>
          <Text className="text-emerald-500 font-bold">Configured (Placeholder)</Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
