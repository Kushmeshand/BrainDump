import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useNotesStore } from '../store/notesStore';
import { useLinksStore } from '../store/linksStore';
import { useCollectionsStore } from '../store/collectionsStore';
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

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  try {
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  } catch {
    return '';
  }
};

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<SortOption>('newest');

  const notes = useNotesStore(state => state.notes);
  const links = useLinksStore(state => state.links);
  const collections = useCollectionsStore(state => state.collections);
  const images = useImagesStore(state => state.images);
  const pdfs = usePdfsStore(state => state.pdfs);

  const queryLower = searchQuery.toLowerCase().trim();
  const queryWords = queryLower.split(' ').filter(w => w.length > 0);

  const filteredNotes = queryWords.length > 0 ? notes.filter(note => {
    const coll = collections.find(c => c.id === note.collectionId);

    const title = (note.title || '').toLowerCase();
    const content = (note.content || '').toLowerCase();
    const collectionName = coll ? (coll.name || '').toLowerCase() : '';
    const ocrText = ((note as any).ocrText || ((note as any).ocr) || '').toLowerCase();
    const tags = (note as any).tags ? (note as any).tags.join(' ').toLowerCase() : '';

    return queryWords.every(word =>
      title.includes(word) ||
      content.includes(word) ||
      collectionName.includes(word) ||
      ocrText.includes(word) ||
      tags.includes(word)
    );
  }) : notes;

  const filteredLinks = queryWords.length > 0 ? links.filter(link => {
    const coll = collections.find(c => c.id === link.collectionId);

    const title = (link.title || '').toLowerCase();
    const url = (link.url || '').toLowerCase();
    const description = (link.description || '').toLowerCase();
    const collectionName = coll ? (coll.name || '').toLowerCase() : '';
    const ocrText = ((link as any).ocrText || ((link as any).ocr) || '').toLowerCase();
    const tags = link.tags ? link.tags.join(' ').toLowerCase() : '';

    return queryWords.every(word =>
      title.includes(word) ||
      url.includes(word) ||
      description.includes(word) ||
      collectionName.includes(word) ||
      ocrText.includes(word) ||
      tags.includes(word)
    );
  }) : links;

  const filteredCollections = queryWords.length > 0 ? collections.filter(coll => {
    const name = (coll.name || '').toLowerCase();
    const description = ((coll as any).description || '').toLowerCase();

    return queryWords.every(word =>
      name.includes(word) ||
      description.includes(word)
    );
  }) : collections;

  const filteredImages = queryWords.length > 0 ? images.filter(img => {
    const coll = collections.find(c => c.id === img.collectionId);

    const title = (img.title || '').toLowerCase();
    const description = (img.description || '').toLowerCase();
    const collectionName = coll ? (coll.name || '').toLowerCase() : '';
    const tags = (img as any).tags ? (img as any).tags.join(' ').toLowerCase() : '';

    return queryWords.every(word =>
      title.includes(word) ||
      description.includes(word) ||
      collectionName.includes(word) ||
      tags.includes(word)
    );
  }) : images;

  const filteredPdfs = queryWords.length > 0 ? pdfs.filter(pdf => {
    const coll = collections.find(c => c.id === pdf.collectionId);

    const title = (pdf.title || '').toLowerCase();
    const description = (pdf.description || '').toLowerCase();
    const collectionName = coll ? (coll.name || '').toLowerCase() : '';
    const fileName = (pdf.fileName || '').toLowerCase();
    const extractedText = (pdf.extractedText || '').toLowerCase();

    return queryWords.every(word =>
      title.includes(word) ||
      description.includes(word) ||
      collectionName.includes(word) ||
      fileName.includes(word) ||
      extractedText.includes(word)
    );
  }) : pdfs;

  const unifiedResults = [
    ...filteredNotes.map(n => ({ ...n, type: 'note' as const })),
    ...filteredLinks.map(l => ({ ...l, type: 'link' as const })),
    ...filteredImages.map(img => ({ ...img, type: 'image' as const })),
    ...filteredPdfs.map(pdf => ({ ...pdf, type: 'pdf' as const }))
  ];

  const displayedDumps = applyFilterAndSort(unifiedResults, filter, sort);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-stone-50 dark:bg-stone-950">
      <View style={{ width: '100%' }} className="p-4 bg-white dark:bg-stone-900 border-b border-stone-150 dark:border-stone-850">
        <View className="flex-row items-center bg-stone-100 dark:bg-stone-800 rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="#78716c" />
          <TextInput
            placeholder="Search notes, links, collections..."
            placeholderTextColor="#a8a29e"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-stone-800 dark:text-stone-100 text-base ml-3"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#a8a29e" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FilterSortBar 
        currentFilter={filter} 
        setFilter={setFilter} 
        currentSort={sort} 
        setSort={setSort} 
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} style={{ flex: 1 }}>
        {(() => {
          if (filteredNotes.length === 0 && filteredLinks.length === 0 && filteredCollections.length === 0 && filteredImages.length === 0 && filteredPdfs.length === 0 && searchQuery.length > 0) {
            console.log("RENDER_BRANCH: No Results Found Branch");
            return (
              <View className="py-12 items-center justify-center">
                <Ionicons name="search-outline" size={48} color="#d6d3d1" />
                <Text className="text-stone-500 dark:text-stone-400 font-medium text-center mt-4">
                  No results found for "{searchQuery}".
                </Text>
              </View>
            );
          } else if (unifiedResults.length === 0 && collections.length === 0) {
            return (
              <View className="py-12 items-center justify-center">
                <Ionicons name="sparkles-outline" size={48} color="#8b5cf6" />
                <Text className="text-stone-800 dark:text-stone-100 text-lg font-bold mt-4">Your Vault is Empty</Text>
                <Text className="text-stone-400 dark:text-stone-550 text-sm text-center mt-2 px-6">
                  Add some resources to see them here.
                </Text>
              </View>
            );
          } else {
            console.log("RENDER_BRANCH: Results Found Branch");
            return (
              <View style={{ width: '100%' }}>
                {filteredCollections.length > 0 && (filter === 'all' || filter === 'no_collection') && (
                  <View className="mb-6">
                    <Text className="text-stone-800 dark:text-stone-100 font-bold text-lg mb-3 ml-1">Collections</Text>
                    {filteredCollections.map(coll => (
                      <TouchableOpacity
                        key={coll.id}
                        onPress={() => navigation.navigate('CollectionDetails', { collectionId: coll.id })}
                        className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-850 mb-3 shadow-sm flex-row items-center"
                      >
                        <View className={`w-10 h-10 rounded-full ${coll.bgClass || 'bg-stone-100'} items-center justify-center mr-3`}>
                          <Ionicons name={coll.icon || 'folder'} size={20} color={coll.colorClass || '#78716c'} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-stone-800 dark:text-stone-100 font-bold text-base" numberOfLines={1}>
                            {coll.name}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#d6d3d1" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {displayedDumps.length > 0 && (
                  <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-12">
                    {displayedDumps.map((item, index) => (
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
                    ))}
                  </View>
                )}
              </View>
            );
          }
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}
