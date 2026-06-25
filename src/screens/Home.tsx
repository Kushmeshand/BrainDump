import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useNotesStore } from '../store/notesStore';
import { useLinksStore } from '../store/linksStore';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { notes } = useNotesStore();
  const { links } = useLinksStore();

  const allDumps = [
    ...notes.map(n => ({ ...n, type: 'note' as const })),
    ...links.map(l => ({ ...l, type: 'link' as const }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50 dark:bg-stone-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }} className="px-4">
      {/* Welcome Card */}
      <View className="mb-6 rounded-3xl bg-brand-600 p-6 shadow-xl relative overflow-hidden">
        <View className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute -left-5 -top-5 w-24 h-24 bg-white/5 rounded-full" />
        
        <Text className="text-white/80 text-xs font-semibold tracking-wider uppercase">Your Knowledge Vault</Text>
        <Text className="text-white text-3xl font-extrabold mt-1">Dump your brain, we'll organize it.</Text>
        <Text className="text-white/90 text-sm mt-3 leading-5">
          Save links, code snippets, notes, and screenshots. Search and recall them instantly with AI.
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="flex-row gap-4 mb-6">
        <View className="flex-1 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-850 shadow-sm">
          <Text className="text-stone-400 dark:text-stone-550 text-xs font-semibold uppercase tracking-wider">Total Items</Text>
          <Text className="text-stone-800 dark:text-stone-100 text-2xl font-black mt-1">{notes.length + links.length}</Text>
        </View>
        <View className="flex-1 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-850 shadow-sm">
          <Text className="text-stone-400 dark:text-stone-550 text-xs font-semibold uppercase tracking-wider">Collections</Text>
          <Text className="text-stone-800 dark:text-stone-100 text-2xl font-black mt-1">12</Text>
        </View>
      </View>

      {/* Quick Add Section */}
      <Text className="text-stone-900 dark:text-stone-100 text-lg font-bold mb-3 px-1">Quick Add</Text>
      <View className="flex-row flex-wrap justify-between gap-y-4 mb-6">
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateLink')}
          className="w-[48%] bg-white dark:bg-stone-900 p-4 rounded-2xl flex-row items-center border border-stone-100 dark:border-stone-850 shadow-sm"
        >
          <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 items-center justify-center mr-3">
            <Ionicons name="link" size={20} color="#3b82f6" />
          </View>
          <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm">Link</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateNote')}
          className="w-[48%] bg-white dark:bg-stone-900 p-4 rounded-2xl flex-row items-center border border-stone-100 dark:border-stone-850 shadow-sm"
        >
          <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 items-center justify-center mr-3">
            <Ionicons name="document-text" size={20} color="#f59e0b" />
          </View>
          <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm">Note</Text>
        </TouchableOpacity>

        <TouchableOpacity className="w-[48%] bg-white dark:bg-stone-900 p-4 rounded-2xl flex-row items-center border border-stone-100 dark:border-stone-850 shadow-sm">
          <View className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 items-center justify-center mr-3">
            <Ionicons name="image" size={20} color="#10b981" />
          </View>
          <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm">Image</Text>
        </TouchableOpacity>

        <TouchableOpacity className="w-[48%] bg-white dark:bg-stone-900 p-4 rounded-2xl flex-row items-center border border-stone-100 dark:border-stone-850 shadow-sm">
          <View className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 items-center justify-center mr-3">
            <Ionicons name="code-working" size={20} color="#8b5cf6" />
          </View>
          <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm">Snippet</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Dumps Section */}
      <View className="flex-row justify-between items-center mb-3 px-1">
        <Text className="text-stone-900 dark:text-stone-100 text-lg font-bold">Recent Dumps</Text>
        <TouchableOpacity>
          <Text className="text-brand-500 font-semibold text-sm">See All</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-12">
        {allDumps.length === 0 ? (
          <View className="p-6 items-center justify-center">
            <Text className="text-stone-400">No items yet. Create one!</Text>
          </View>
        ) : (
          allDumps.slice(0, 5).map((item, index) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => item.type === 'note' ? navigation.navigate('CreateNote', { noteId: item.id }) : navigation.navigate('CreateLink', { linkId: item.id })}
              className={`flex-row items-center p-4 ${index !== Math.min(allDumps.length, 5) - 1 ? 'border-b border-stone-50 dark:border-stone-850' : ''}`}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.type === 'note' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                <Ionicons name={item.type === 'note' ? 'document-text' : 'link'} size={20} color={item.type === 'note' ? '#f59e0b' : '#3b82f6'} />
              </View>
              <View className="flex-1">
                <Text className="text-stone-800 dark:text-stone-100 font-semibold text-sm" numberOfLines={1}>
                  {item.title || (item.type === 'note' ? 'Untitled Note' : item.url)}
                </Text>
                <Text className="text-stone-400 dark:text-stone-550 text-xs" numberOfLines={1}>
                  {item.type === 'note' ? (item.content.substring(0, 50) || 'Empty note') : (item.description || item.url)}
                </Text>
              </View>
              <View className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-md">
                <Text className="text-stone-500 dark:text-stone-400 text-[10px] font-semibold uppercase">{item.type}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
