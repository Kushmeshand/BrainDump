import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import PressableScale from '../PressableScale';

export default function SearchCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <PressableScale 
      onPress={() => navigation.navigate('MainTabs', { screen: 'Search' } as any)} 
      className="mb-8"
    >
      <View className="bg-white dark:bg-stone-900 flex-row items-center p-4 rounded-3xl border border-stone-100 dark:border-stone-850 shadow-sm">
        <Ionicons name="search" size={22} color="#a8a29e" className="mr-3" />
        <Text className="text-stone-400 font-medium text-base">
          Search notes, PDFs, screenshots...
        </Text>
      </View>
    </PressableScale>
  );
}
