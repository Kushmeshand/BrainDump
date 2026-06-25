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

const ImageSearchThumbnail = ({ imageUrl }: { imageUrl: string }) => {
  const [error, setError] = useState(false);

  if (imageUrl && !error) {
    return (
      <View className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-stone-800 mr-3 overflow-hidden">
        <Image 
          source={{ uri: imageUrl }} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover" 
          onError={() => setError(true)}
        />
      </View>
    );
  }

  return (
    <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-emerald-50 dark:bg-emerald-900/30">
      <Ionicons name="image" size={20} color="#10b981" />
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
  const [searchQuery, setSearchQuery] = useState('Fifa');

  const notes = useNotesStore(state => state.notes);
  const links = useLinksStore(state => state.links);
  const collections = useCollectionsStore(state => state.collections);
  const images = useImagesStore(state => state.images);

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
  }) : [];

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
  }) : [];

  const filteredCollections = queryWords.length > 0 ? collections.filter(coll => {
    const name = (coll.name || '').toLowerCase();
    const description = ((coll as any).description || '').toLowerCase();

    return queryWords.every(word =>
      name.includes(word) ||
      description.includes(word)
    );
  }) : [];

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
  }) : [];

  console.log("RENDER_START: SearchScreen rendering. query:", searchQuery, "filteredNotes:", filteredNotes.length);

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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} style={{ flex: 1 }}>
        {(() => {
          if (searchQuery.trim().length === 0) {
            console.log("RENDER_BRANCH: Empty Query Branch");
            return (
              <View className="py-12 items-center justify-center">
                <Ionicons name="sparkles-outline" size={48} color="#8b5cf6" />
                <Text className="text-stone-800 dark:text-stone-100 text-lg font-bold mt-4">Search your Vault</Text>
                <Text className="text-stone-400 dark:text-stone-550 text-sm text-center mt-2 px-6">
                  Start typing to instantly search your notes, links, and collections.
                </Text>
              </View>
            );
          } else if (filteredNotes.length === 0 && filteredLinks.length === 0 && filteredCollections.length === 0 && filteredImages.length === 0) {
            console.log("RENDER_BRANCH: No Results Found Branch");
            return (
              <View className="py-12 items-center justify-center">
                <Ionicons name="search-outline" size={48} color="#d6d3d1" />
                <Text className="text-stone-500 dark:text-stone-400 font-medium text-center mt-4">
                  No results found for "{searchQuery}".
                </Text>
              </View>
            );
          } else {
            console.log("RENDER_BRANCH: Results Found Branch");
            return (
              <View style={{ width: '100%' }}>
                {filteredNotes.length > 0 && (() => {
                  console.log("RENDER_SECTION: Notes");
                  return (
                    <View className="mb-6">
                      <Text className="text-stone-800 dark:text-stone-100 font-bold text-lg mb-3 ml-1">Notes</Text>
                      {filteredNotes.map(note => {
                        console.log("RENDER_ITEM: Note ID", note.id);
                        return (
                          <TouchableOpacity
                            key={note.id}
                            onPress={() => navigation.navigate('CreateNote', { noteId: note.id })}
                            className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-850 mb-3 shadow-sm"
                          >
                            <View className="flex-row items-center mb-2">
                              <Ionicons name="document-text" size={16} color="#f59e0b" />
                              <Text className="text-stone-800 dark:text-stone-100 font-bold ml-2 flex-1" numberOfLines={1}>
                                {note.title || 'Untitled Note'}
                              </Text>
                            </View>
                            <Text className="text-stone-500 dark:text-stone-400 text-sm leading-5 mb-2" numberOfLines={2}>
                              {note.content || 'Empty note'}
                            </Text>
                            <Text className="text-stone-400 dark:text-stone-500 text-xs">
                              {formatDate(note.createdAt)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })()}

                {filteredLinks.length > 0 && (() => {
                  console.log("RENDER_SECTION: Links");
                  return (
                    <View className="mb-6">
                      <Text className="text-stone-800 dark:text-stone-100 font-bold text-lg mb-3 ml-1">Links</Text>
                      {filteredLinks.map(link => {
                        console.log("RENDER_ITEM: Link ID", link.id);
                        return (
                          <TouchableOpacity
                            key={link.id}
                            onPress={() => navigation.navigate('CreateLink', { linkId: link.id })}
                            className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-850 mb-3 shadow-sm"
                          >
                            <View className="flex-row items-center mb-2">
                              <Ionicons name="link" size={16} color="#3b82f6" />
                              <Text className="text-stone-800 dark:text-stone-100 font-bold ml-2 flex-1" numberOfLines={1}>
                                {link.title || link.url}
                              </Text>
                            </View>
                            {!!link.description && (
                              <Text className="text-stone-500 dark:text-stone-400 text-sm leading-5 mb-2" numberOfLines={2}>
                                {link.description}
                              </Text>
                            )}
                            <Text className="text-stone-400 dark:text-stone-500 text-xs">
                              {formatDate(link.createdAt)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })()}

                {filteredImages.length > 0 && (() => {
                  console.log("RENDER_SECTION: Images");
                  return (
                    <View className="mb-6">
                      <Text className="text-stone-800 dark:text-stone-100 font-bold text-lg mb-3 ml-1">Images</Text>
                      {filteredImages.map(img => {
                        console.log("RENDER_ITEM: Image ID", img.id);
                        return (
                          <TouchableOpacity
                            key={img.id}
                            onPress={() => navigation.navigate('CreateImage', { imageId: img.id })}
                            className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-850 mb-3 shadow-sm flex-row items-center"
                          >
                            <ImageSearchThumbnail imageUrl={img.imageUrl} />
                            <View className="flex-1 justify-center">
                              <View className="flex-row items-center mb-1">
                                <Ionicons name="image" size={14} color="#10b981" />
                                <Text className="text-stone-800 dark:text-stone-100 font-bold ml-2 flex-1" numberOfLines={1}>
                                  {img.title || 'Untitled Image'}
                                </Text>
                              </View>
                              {!!img.description && (
                                <Text className="text-stone-500 dark:text-stone-400 text-sm leading-5 mb-1" numberOfLines={1}>
                                  {img.description}
                                </Text>
                              )}
                              <Text className="text-stone-400 dark:text-stone-500 text-xs">
                                {formatDate(img.createdAt)}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })()}

                {filteredCollections.length > 0 && (() => {
                  console.log("RENDER_SECTION: Collections");
                  return (
                    <View className="mb-6">
                      <Text className="text-stone-800 dark:text-stone-100 font-bold text-lg mb-3 ml-1">Collections</Text>
                      {filteredCollections.map(coll => {
                        console.log("RENDER_ITEM: Collection ID", coll.id);
                        return (
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
                        );
                      })}
                    </View>
                  );
                })()}
              </View>
            );
          }
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}
