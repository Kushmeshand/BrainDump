import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function LoadingScreen(): React.JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-stone-50 dark:bg-stone-950">
      <View className="items-center">
        {/* Logo Icon Bubble */}
        <View className="w-16 h-16 rounded-3xl bg-brand-500 items-center justify-center shadow-lg shadow-brand-500/20 mb-6">
          <Text className="text-white text-3xl font-black">B</Text>
        </View>
        <Text className="text-stone-800 dark:text-stone-100 text-xl font-bold mb-2">BrainDump</Text>
        <Text className="text-stone-400 dark:text-stone-500 text-sm mb-6">Unlocking your vault...</Text>
        <ActivityIndicator size="small" color="#8b5cf6" />
      </View>
    </View>
  );
}
