import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '../../store/profileStore';
import { useAuthStore } from '../../store/authStore';

export default function DashboardHeader() {
  const { profile } = useProfileStore();
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = profile?.displayName || user?.displayName || 'Knowledge Builder';
  const firstName = displayName.split(' ')[0];

  return (
    <View className="flex-row items-center justify-between mb-8">
      <View>
        <Text className="text-stone-800 dark:text-stone-100 text-2xl font-black">
          {getGreeting()}, {firstName} <Text className="text-2xl">👋</Text>
        </Text>
        <Text className="text-stone-500 dark:text-stone-400 text-sm mt-1 font-medium">
          Your personal AI study companion.
        </Text>
      </View>

      <View className="w-12 h-12 rounded-full border-2 border-brand-500/20 bg-stone-100 dark:bg-stone-800 items-center justify-center overflow-hidden">
        {profile?.photoURL ? (
          <Image source={{ uri: profile.photoURL }} className="w-full h-full" />
        ) : (
          <Ionicons name="person" size={24} color="#8b5cf6" />
        )}
      </View>
    </View>
  );
}
