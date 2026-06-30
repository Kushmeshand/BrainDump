import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useCollectionsStore } from '../store/collectionsStore';
import { useImagesStore } from '../store/imagesStore';
import { createImage, updateImage, deleteImage } from '../services/images';
import TagInput from '../components/TagInput';
import AIStudyAssistant from '../components/AIStudyAssistant';

export default function CreateImageScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateImage'>>();
  const { uri, uris, imageId } = route.params;

  const collections = useCollectionsStore(state => state.collections);
  const existingImage = useImagesStore(state => state.images.find(img => img.id === imageId));

  const initialUris = uris || (uri ? [uri] : []);
  const [selectedUris, setSelectedUris] = useState<string[]>(initialUris);

  const [title, setTitle] = useState(existingImage?.title || '');
  const [description, setDescription] = useState(existingImage?.description || '');
  const [collectionId, setCollectionId] = useState<string | null>(existingImage?.collectionId || null);
  const [tags, setTags] = useState<string[]>(existingImage?.tags || []);
  const [favorite, setFavorite] = useState(existingImage?.favorite || false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSave = async () => {
    if (!existingImage && selectedUris.length === 0) return;
    setIsUploading(true);
    try {
      if (existingImage) {
        // Edit mode: only update Firestore, DO NOT re-upload image
        const finalTitle = title.trim() || 'Untitled Image';
        await updateImage(existingImage.id, finalTitle, description, collectionId, tags, favorite);
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MainTabs', { screen: 'Home' } as any);
      } else if (selectedUris.length > 0) {
        // Create mode: sequentially upload images
        for (let i = 0; i < selectedUris.length; i++) {
          setUploadIndex(i + 1);
          setUploadProgress(0);

          let finalTitle = title.trim();
          if (!finalTitle) {
            finalTitle = selectedUris.length === 1 ? 'Untitled Image' : `Untitled Image ${i + 1}`;
          }

          await createImage(
            selectedUris[i],
            finalTitle,
            description,
            collectionId,
            tags,
            favorite,
            (progress) => setUploadProgress(progress)
          );
        }
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MainTabs', { screen: 'Home' } as any);
      }
    } catch (error) {
      Alert.alert('Upload Failed', 'There was an error saving your image(s).');
      setIsUploading(false);
      setUploadIndex(0);
    }
  };

  const handleDelete = () => {
    if (!existingImage) return;
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteImage(existingImage.id);
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('MainTabs', { screen: 'Home' } as any);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Ionicons name="close" size={24} className="color-stone-800 dark:color-stone-200" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-stone-800 dark:text-stone-100">Save Image</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isUploading || (!existingImage && selectedUris.length === 0)}
          className={`px-4 py-1.5 rounded-full ${isUploading || (!existingImage && selectedUris.length === 0) ? 'bg-brand-300' : 'bg-brand-500'}`}
        >
          <Text className="text-white font-bold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Single Image Preview (Edit Mode) */}
        {existingImage && (
          <TouchableOpacity 
            className="items-center mb-6"
            onPress={() => navigation.navigate('ImageViewer', { imageId: existingImage.id })}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: existingImage.imageUrl }} 
              className="w-full h-64 rounded-xl bg-stone-200 dark:bg-stone-800"
              resizeMode="contain"
            />
            <View className="absolute bottom-2 right-2 bg-black/60 px-3 py-1.5 rounded-full flex-row items-center">
              <Ionicons name="expand" size={14} color="#fff" />
              <Text className="text-white text-xs font-bold ml-1">View Full</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Multi-Image Preview (Create Mode) */}
        {!existingImage && selectedUris.length > 0 && (
          <View className="mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {selectedUris.map((u, i) => (
                <View key={i} className="relative mr-3">
                  <Image source={{ uri: u }} className="w-32 h-32 rounded-xl bg-stone-200 dark:bg-stone-800" resizeMode="cover" />
                  <TouchableOpacity 
                    onPress={() => setSelectedUris(selectedUris.filter((_, index) => index !== i))}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 border-2 border-stone-50 dark:border-stone-950"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Metadata Form */}
        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-1 ml-1">Title (Optional)</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="E.g., Design Inspiration"
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
              placeholder="What is this about?"
              placeholderTextColor="#a8a29e"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100 min-h-[100px]"
            />
          </View>

          {/* Collection Picker (Simplified for now) */}
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

          {/* Favorite Toggle */}
          <TouchableOpacity 
            onPress={() => setFavorite(!favorite)}
            className="mt-6 flex-row items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800"
          >
            <View className="flex-row items-center">
              <Ionicons name={favorite ? "star" : "star-outline"} size={20} color={favorite ? "#f59e0b" : "#a8a29e"} />
              <Text className="ml-3 text-stone-800 dark:text-stone-100 font-medium">Favorite</Text>
            </View>
          </TouchableOpacity>

          {/* Delete Button (Edit Mode Only) */}
          {existingImage && (
            <TouchableOpacity 
              onPress={handleDelete}
              className="mt-4 bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex-row items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="ml-2 text-red-500 font-bold">Delete Image</Text>
            </TouchableOpacity>
          )}

          {imageId && existingImage && (
            <View className="mt-4">
              <AIStudyAssistant
                type="image"
                id={imageId}
                aiGeneratedAt={existingImage.aiGeneratedAt}
                aiExplain={existingImage.aiExplain}
                aiQuiz={existingImage.aiQuiz}
                aiViva={existingImage.aiViva}
                aiRevisionNotes={existingImage.aiRevisionNotes}
                getContextInput={() => ({
                  title,
                  description,
                  tags,
                  collectionName: collectionId ? collections.find(c => c.id === collectionId)?.name : undefined,
                  extractedText: (existingImage as any).ocrText || (existingImage as any).ocr
                })}
              />
            </View>
          )}
        </View>
        <View className="h-20" />
      </ScrollView>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <View className="bg-white dark:bg-stone-900 p-6 rounded-2xl items-center w-3/4 max-w-xs shadow-2xl">
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text className="text-stone-800 dark:text-stone-100 font-bold mt-4 text-lg">
              {existingImage ? 'Updating...' : `Uploading ${uploadIndex} of ${selectedUris.length}...`}
            </Text>
            {!existingImage && (
              <View className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full mt-4 overflow-hidden">
                <View 
                  className="h-full bg-brand-500 rounded-full" 
                  style={{ width: `${Math.max(uploadProgress, 5)}%` }} 
                />
              </View>
            )}
            {!existingImage && (
              <Text className="text-stone-500 dark:text-stone-400 text-xs mt-2">{Math.round(uploadProgress)}% Complete</Text>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
