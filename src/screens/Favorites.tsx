import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useNotesStore } from '../store/notesStore';
import { useLinksStore } from '../store/linksStore';
import { useImagesStore } from '../store/imagesStore';
import { usePdfsStore } from '../store/pdfsStore';
import FilterSortBar, { FilterOption, SortOption } from '../components/FilterSortBar';
import { applyFilterAndSort } from '../utils/filterSort';

const FeedItemIcon = ({ item }: { item: any }) => {
  const [error, setError] = useState(false);

  if (item.type === 'image' && item.imageUrl && !error) {
    return (
      <View className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-stone-800 mr-3 overflow-hidden">
        <Image 
          source={{ uri: item.imageUrl }} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover" 
          onError={() => setError(true)}
        />
      </View>
    );
  }

  return (
    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.type === 'note' ? 'bg-amber-50 dark:bg-amber-900/30' : item.type === 'link' ? 'bg-blue-50 dark:bg-blue-900/30' : item.type === 'pdf' ? 'bg-rose-50 dark:bg-rose-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
      <Ionicons name={item.type === 'note' ? 'document-text' : item.type === 'link' ? 'link' : item.type === 'pdf' ? 'document-text-outline' : 'image'} size={20} color={item.type === 'note' ? '#f59e0b' : item.type === 'link' ? '#3b82f6' : item.type === 'pdf' ? '#e11d48' : '#10b981'} />
    </View>
  );
};

export default function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { notes } = useNotesStore();
  const { links } = useLinksStore();
  const { images } = useImagesStore();
  const { pdfs } = usePdfsStore();

  const [filter, setFilter] = useState<FilterOption>('favorites');
  const [sort, setSort] = useState<SortOption>('newest');

  const allDumps = [
    ...notes.map(n => ({ ...n, type: 'note' as const })),
    ...links.map(l => ({ ...l, type: 'link' as const })),
    ...images.map(img => ({ ...img, type: 'image' as const })),
    ...pdfs.map(pdf => ({ ...pdf, type: 'pdf' as const }))
  ];

  // In the Favorites screen, we implicitly force the 'favorites' filter if it's set to 'all' to prevent showing non-favorites?
  // Wait, the user can change the filter in the FilterSortBar. If they are in the Favorites screen, they want to filter their favorites!
  // So we first filter by `favorite === true`, THEN we apply the user's filter.
  const favoriteDumps = allDumps.filter(d => d.favorite);
  const displayedDumps = applyFilterAndSort(favoriteDumps, filter, sort);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50 dark:bg-stone-950">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-2xl font-black text-stone-900 dark:text-white">Favorites</Text>
      </View>

      <FilterSortBar 
        currentFilter={filter} 
        setFilter={setFilter} 
        currentSort={sort} 
        setSort={setSort} 
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="px-4 mt-2">
        <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-12">
          {displayedDumps.length === 0 ? (
            <View className="p-8 items-center justify-center">
              <Ionicons name="star-outline" size={48} color="#d6d3d1" />
              <Text className="text-stone-400 mt-4 text-center font-medium">No favorites found.</Text>
            </View>
          ) : (
            displayedDumps.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                onPress={() => {
                  if (item.type === 'note') navigation.navigate('CreateNote', { noteId: item.id });
                  else if (item.type === 'link') navigation.navigate('CreateLink', { linkId: item.id });
                  else if (item.type === 'image') navigation.navigate('CreateImage', { imageId: item.id });
                  else if (item.type === 'pdf') navigation.navigate('CreatePdf', { pdfId: item.id });
                }}
                className={`flex-row items-center p-4 ${index !== displayedDumps.length - 1 ? 'border-b border-stone-50 dark:border-stone-850' : ''}`}
              >
                <FeedItemIcon item={item} />
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-stone-800 dark:text-stone-100 font-semibold text-sm flex-1" numberOfLines={1}>
                      {item.title || (item.type === 'note' ? 'Untitled Note' : item.type === 'image' ? 'Untitled Image' : item.type === 'pdf' ? item.fileName : item.url)}
                    </Text>
                    {item.favorite && <Ionicons name="star" size={12} color="#f59e0b" className="ml-2" />}
                  </View>
                  <Text className="text-stone-400 dark:text-stone-550 text-xs mt-0.5" numberOfLines={1}>
                    {item.type === 'note' ? (item.content?.substring(0, 50) || 'Empty note') : item.type === 'pdf' ? (item.description || 'PDF Document') : item.type === 'image' ? (item.description || 'Image Upload') : (item.description || item.url)}
                  </Text>
                  {item.tags && item.tags.length > 0 && (
                    <View className="flex-row mt-1">
                      {item.tags.slice(0, 3).map((tag: string, i: number) => (
                        <Text key={i} className="text-[10px] text-brand-600 dark:text-brand-400 mr-2">#{tag}</Text>
                      ))}
                    </View>
                  )}
                </View>
                <View className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-md ml-2">
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
