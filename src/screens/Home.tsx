import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { notes } = useNotesStore();
  const { links } = useLinksStore();
  const { images } = useImagesStore();
  const { pdfs } = usePdfsStore();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<SortOption>('newest');

  const handleImagePick = () => {
    Alert.alert('Upload Image', 'Choose an option', [
      {
        text: 'Pick from Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsMultipleSelection: true,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            navigation.navigate('CreateImage', { uris: result.assets.map(a => a.uri) });
          }
        }
      },
      {
        text: 'Take Photo',
        onPress: async () => {
          const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
          if (permissionResult.granted === false) {
            Alert.alert('Permission required', 'Camera access is required to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            navigation.navigate('CreateImage', { uris: [result.assets[0].uri] });
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handlePdfPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        navigation.navigate('CreatePdf', { uris: result.assets.map(a => a.uri) });
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
    }
  };

  const allDumps = [
    ...notes.map(n => ({ ...n, type: 'note' as const })),
    ...links.map(l => ({ ...l, type: 'link' as const })),
    ...images.map(img => ({ ...img, type: 'image' as const })),
    ...pdfs.map(pdf => ({ ...pdf, type: 'pdf' as const }))
  ];

  const displayedDumps = applyFilterAndSort(allDumps, filter, sort);

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
          <Text className="text-stone-800 dark:text-stone-100 text-2xl font-black mt-1">{notes.length + links.length + images.length + pdfs.length}</Text>
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

        <TouchableOpacity 
          onPress={handleImagePick}
          className="w-[48%] bg-white dark:bg-stone-900 p-4 rounded-2xl flex-row items-center border border-stone-100 dark:border-stone-850 shadow-sm"
        >
          <View className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 items-center justify-center mr-3">
            <Ionicons name="image" size={20} color="#10b981" />
          </View>
          <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm">Image</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handlePdfPick}
          className="w-[48%] bg-white dark:bg-stone-900 p-4 rounded-2xl flex-row items-center border border-stone-100 dark:border-stone-850 shadow-sm"
        >
          <View className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 items-center justify-center mr-3">
            <Ionicons name="document-outline" size={20} color="#e11d48" />
          </View>
          <Text className="text-stone-700 dark:text-stone-200 font-semibold text-sm">PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Dumps Section */}
      <FilterSortBar 
        currentFilter={filter} 
        setFilter={setFilter} 
        currentSort={sort} 
        setSort={setSort} 
      />

      <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 overflow-hidden shadow-sm mb-12">
        {displayedDumps.length === 0 ? (
          <View className="p-6 items-center justify-center">
            <Text className="text-stone-400">No items found.</Text>
          </View>
        ) : (
          displayedDumps.slice(0, 50).map((item, index) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => {
                if (item.type === 'note') navigation.navigate('CreateNote', { noteId: item.id });
                else if (item.type === 'link') navigation.navigate('CreateLink', { linkId: item.id });
                else if (item.type === 'image') navigation.navigate('CreateImage', { imageId: item.id });
                else if (item.type === 'pdf') navigation.navigate('CreatePdf', { pdfId: item.id });
              }}
              className={`flex-row items-center p-4 ${index !== Math.min(displayedDumps.length, 50) - 1 ? 'border-b border-stone-50 dark:border-stone-850' : ''}`}
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
