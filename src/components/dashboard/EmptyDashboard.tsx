import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function EmptyDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Animated.View entering={FadeIn.delay(300)} className="flex-1 items-center justify-center py-20 px-4">
      <View className="w-24 h-24 bg-brand-500/10 rounded-full items-center justify-center mb-6">
        <Ionicons name="sparkles" size={48} color="#8b5cf6" />
      </View>
      <Text className="text-stone-900 dark:text-stone-100 text-2xl font-black text-center mb-2">
        Start building your second brain.
      </Text>
      <Text className="text-stone-500 dark:text-stone-400 text-center mb-8 px-4">
        Save links, code snippets, notes, and screenshots. Search and recall them instantly with AI.
      </Text>
      <TouchableOpacity 
        onPress={() => navigation.navigate('CreateNote', {})}
        className="bg-brand-500 px-6 py-4 rounded-full flex-row items-center shadow-sm shadow-brand-500/30"
      >
        <Ionicons name="add" size={20} color="#ffffff" className="mr-2" />
        <Text className="text-white font-bold text-base">Upload First Resource</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
