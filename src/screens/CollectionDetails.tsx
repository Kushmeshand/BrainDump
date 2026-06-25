import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useCollectionsStore } from '../store/collectionsStore';
import { useNotesStore } from '../store/notesStore';
import { useLinksStore } from '../store/linksStore';

type CollectionDetailsRouteProp = RouteProp<RootStackParamList, 'CollectionDetails'>;

export default function CollectionDetailsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<CollectionDetailsRouteProp>();
  const { collectionId } = route.params;

  const collection = useCollectionsStore(state => 
    state.collections.find(c => c.id === collectionId)
  );

  const notes = useNotesStore(state => 
    state.notes.filter(n => n.collectionId === collectionId)
  );

  const links = useLinksStore(state => 
    state.links.filter(l => l.collectionId === collectionId)
  );

  const allItems = [
    ...notes.map(n => ({ ...n, type: 'note' as const })),
    ...links.map(l => ({ ...l, type: 'link' as const }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  if (!collection) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-stone-50 dark:bg-stone-950 justify-center items-center">
        <Text className="text-stone-500">Collection not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 px-4 py-2 bg-stone-200 rounded-lg">
          <Text className="text-stone-800">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-stone-50 dark:bg-stone-950">
      <View className="flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800"
        >
          <Ionicons name="arrow-back" size={20} color="#78716c" />
        </TouchableOpacity>
        
        <View className="flex-row items-center gap-2">
          <View className={`w-8 h-8 rounded-lg ${collection.bgClass} items-center justify-center`}>
            <Ionicons name={collection.icon} size={16} color={collection.colorClass} />
          </View>
          <Text className="text-stone-900 dark:text-stone-100 font-bold text-lg">{collection.name}</Text>
        </View>

        <View className="w-10 h-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-4 mt-2">
        <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm">
          {allItems.length === 0 ? (
            <View className="p-8 items-center justify-center">
              <View className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-800/50 items-center justify-center mb-4">
                <Ionicons name="folder-open-outline" size={32} color="#a8a29e" />
              </View>
              <Text className="text-stone-500 font-medium text-center">No items in this collection yet.</Text>
              <Text className="text-stone-400 text-xs text-center mt-1">Tap Quick Add on Home to create one!</Text>
            </View>
          ) : (
            allItems.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                onPress={() => item.type === 'note' ? navigation.navigate('CreateNote', { noteId: item.id }) : navigation.navigate('CreateLink', { linkId: item.id })}
                className={`flex-row items-center p-4 ${index !== allItems.length - 1 ? 'border-b border-stone-50 dark:border-stone-850' : ''}`}
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
                <Ionicons name="chevron-forward" size={16} color="#d6d3d1" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
