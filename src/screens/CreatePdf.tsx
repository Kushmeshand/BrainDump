import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useCollectionsStore } from '../store/collectionsStore';
import { usePdfsStore } from '../store/pdfsStore';
import { createPdf, updatePdf, deletePdf } from '../services/pdfs';
import TagInput from '../components/TagInput';

export default function CreatePdfScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreatePdf'>>();
  const { uris, pdfId } = route.params;

  const collections = useCollectionsStore(state => state.collections);
  const existingPdf = usePdfsStore(state => state.pdfs.find(p => p.id === pdfId));

  const initialUris = uris || [];
  const [selectedUris, setSelectedUris] = useState<string[]>(initialUris);

  const [title, setTitle] = useState(existingPdf?.title || '');
  const [description, setDescription] = useState(existingPdf?.description || '');
  const [collectionId, setCollectionId] = useState<string | null>(existingPdf?.collectionId || null);
  const [tags, setTags] = useState<string[]>(existingPdf?.tags || []);
  const [favorite, setFavorite] = useState(existingPdf?.favorite || false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSave = async () => {
    if (!existingPdf && selectedUris.length === 0) return;
    setIsUploading(true);
    try {
      if (existingPdf) {
        const finalTitle = title.trim() || 'Untitled PDF';
        await updatePdf(existingPdf.id, finalTitle, description, collectionId, tags, favorite);
        navigation.goBack();
      } else if (selectedUris.length > 0) {
        for (let i = 0; i < selectedUris.length; i++) {
          setUploadIndex(i + 1);
          setUploadProgress(0);

          let finalTitle = title.trim();
          if (!finalTitle) {
            finalTitle = selectedUris.length === 1 ? 'Untitled PDF' : `Untitled PDF ${i + 1}`;
          }

          const fileName = selectedUris[i].split('/').pop() || 'document.pdf';
          
          await createPdf(
            selectedUris[i],
            fileName,
            0,
            finalTitle,
            description,
            collectionId,
            tags,
            favorite,
            (progress) => setUploadProgress(progress)
          );
        }
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Upload Failed', 'There was an error saving your PDF(s).');
      setIsUploading(false);
      setUploadIndex(0);
    }
  };

  const handleDelete = () => {
    if (!existingPdf) return;
    Alert.alert(
      'Delete PDF',
      'Are you sure you want to delete this PDF? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deletePdf(existingPdf.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-stone-50 dark:bg-stone-950">
      <View className="flex-row items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Ionicons name="close" size={24} className="color-stone-800 dark:color-stone-200" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-stone-800 dark:text-stone-100">Save PDF</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isUploading || (!existingPdf && selectedUris.length === 0)}
          className={`px-4 py-1.5 rounded-full ${isUploading || (!existingPdf && selectedUris.length === 0) ? 'bg-brand-300' : 'bg-brand-500'}`}
        >
          <Text className="text-white font-bold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {existingPdf && (
          <TouchableOpacity 
            className="mb-6 bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 flex-row items-center"
            onPress={() => navigation.navigate('PdfViewer', { pdfId: existingPdf.id })}
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 bg-rose-100 dark:bg-rose-900/50 rounded-lg items-center justify-center mr-3">
              <Ionicons name="document-text" size={24} color="#e11d48" />
            </View>
            <View className="flex-1">
              <Text className="text-stone-800 dark:text-stone-100 font-bold" numberOfLines={1}>{existingPdf.fileName}</Text>
              <Text className="text-stone-500 dark:text-stone-400 text-xs mt-1">
                {(existingPdf.fileSize / 1024 / 1024).toFixed(2)} MB {existingPdf.pageCount ? `• ${existingPdf.pageCount} pages` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a8a29e" />
          </TouchableOpacity>
        )}

        {!existingPdf && selectedUris.length > 0 && (
          <View className="mb-6 space-y-3">
            {selectedUris.map((u, i) => (
              <View key={i} className="bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex-row items-center mt-2">
                <View className="w-10 h-10 bg-rose-50 dark:bg-rose-950/30 rounded-lg items-center justify-center mr-3">
                  <Ionicons name="document-text" size={20} color="#e11d48" />
                </View>
                <Text className="flex-1 text-stone-800 dark:text-stone-100 font-medium" numberOfLines={1}>
                  {decodeURIComponent(u.split('/').pop() || `Document ${i + 1}`)}
                </Text>
                <TouchableOpacity 
                  onPress={() => setSelectedUris(selectedUris.filter((_, index) => index !== i))}
                  className="p-2 ml-2"
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-1 ml-1">Title (Optional)</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="E.g., Quarterly Report"
              placeholderTextColor="#a8a29e"
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100"
            />
          </View>

          <View className="mt-4">
            <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-1 ml-1">Tags</Text>
            <TagInput tags={tags} setTags={setTags} />
          </View>

          <View className="mt-4">
            <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-1 ml-1">Description (Optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief summary..."
              placeholderTextColor="#a8a29e"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100 min-h-[100px]"
            />
          </View>

          <View className="mt-4">
            <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-1 ml-1">Collection</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <TouchableOpacity
                onPress={() => setCollectionId(null)}
                className={`px-4 py-2 rounded-full border mr-2 flex-row items-center ${collectionId === null ? 'bg-stone-800 border-stone-800 dark:bg-stone-200 dark:border-stone-200' : 'bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800'}`}
              >
                <Text className={`${collectionId === null ? 'text-white dark:text-stone-900' : 'text-stone-600 dark:text-stone-400'} font-medium`}>None</Text>
              </TouchableOpacity>
              {collections.map(coll => (
                <TouchableOpacity
                  key={coll.id}
                  onPress={() => setCollectionId(coll.id)}
                  className={`px-4 py-2 rounded-full border mr-2 flex-row items-center ${collectionId === coll.id ? 'bg-stone-800 border-stone-800 dark:bg-stone-200 dark:border-stone-200' : 'bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800'}`}
                >
                  <Ionicons name={coll.icon as any} size={14} color={collectionId === coll.id ? (coll.colorClass || '#fff') : '#78716c'} className="mr-1" />
                  <Text className={`${collectionId === coll.id ? 'text-white dark:text-stone-900' : 'text-stone-600 dark:text-stone-400'} font-medium ml-1`}>{coll.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity 
            onPress={() => setFavorite(!favorite)}
            className="mt-6 flex-row items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800"
          >
            <View className="flex-row items-center">
              <Ionicons name={favorite ? "star" : "star-outline"} size={20} color={favorite ? "#f59e0b" : "#a8a29e"} />
              <Text className="ml-3 text-stone-800 dark:text-stone-100 font-medium">Favorite</Text>
            </View>
          </TouchableOpacity>

          {existingPdf && (
            <TouchableOpacity 
              onPress={handleDelete}
              className="mt-4 bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex-row items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="ml-2 text-red-500 font-bold">Delete PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {isUploading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <View className="bg-white dark:bg-stone-900 p-6 rounded-2xl items-center w-3/4 max-w-xs shadow-2xl">
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text className="text-stone-800 dark:text-stone-100 font-bold mt-4 text-lg">
              {existingPdf ? 'Updating...' : `Uploading ${uploadIndex} of ${selectedUris.length}...`}
            </Text>
            {!existingPdf && (
              <View className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full mt-4 overflow-hidden">
                <View 
                  className="h-full bg-brand-500 rounded-full" 
                  style={{ width: `${Math.max(uploadProgress, 5)}%` }} 
                />
              </View>
            )}
            {!existingPdf && (
              <Text className="text-stone-500 dark:text-stone-400 text-xs mt-2">{Math.round(uploadProgress)}% Complete</Text>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
