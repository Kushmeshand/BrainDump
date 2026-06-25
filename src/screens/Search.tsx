import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useNotesStore } from '../store/notesStore';
import { useLinksStore } from '../store/linksStore';
import { useCollectionsStore } from '../store/collectionsStore';

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

  const notes = useNotesStore(state => state.notes);
  const links = useLinksStore(state => state.links);
  const collections = useCollectionsStore(state => state.collections);

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
        {searchQuery.trim().length === 0 ? (
          <View className="py-12 items-center justify-center">
            <Ionicons name="sparkles-outline" size={48} color="#8b5cf6" />
            <Text className="text-stone-800 dark:text-stone-100 text-lg font-bold mt-4">Search your Vault</Text>
            <Text className="text-stone-400 dark:text-stone-550 text-sm text-center mt-2 px-6">
              Start typing to instantly search your notes, links, and collections.
            </Text>
          </View>
        ) : filteredNotes.length === 0 && filteredLinks.length === 0 && filteredCollections.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <Ionicons name="search-outline" size={48} color="#d6d3d1" />
            <Text className="text-stone-500 dark:text-stone-400 font-medium text-center mt-4">
              No results found for "{searchQuery}".
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            {filteredNotes.length > 0 && (
              <View className="mb-6">
                <Text className="text-stone-800 dark:text-stone-100 font-bold text-lg mb-3 ml-1">Notes</Text>
                {filteredNotes.map(note => (
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
                ))}
              </View>
            )}

            {filteredLinks.length > 0 && (
              <View className="mb-6">
                <Text className="text-stone-800 dark:text-stone-100 font-bold text-lg mb-3 ml-1">Links</Text>
                {filteredLinks.map(link => (
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
                ))}
              </View>
            )}

            {filteredCollections.length > 0 && (
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
