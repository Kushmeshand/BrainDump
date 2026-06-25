import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useCollectionsStore } from '../store/collectionsStore';
import { useLinksStore } from '../store/linksStore';
import { createLink, updateLink, deleteLink } from '../services/links';
import TagInput from '../components/TagInput';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateLink'>;

export default function CreateLinkScreen({ route, navigation }: Props) {
  const linkId = route.params?.linkId;
  const { collections } = useCollectionsStore();
  const { links } = useLinksStore();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCollections, setShowCollections] = useState(false);

  useEffect(() => {
    if (linkId) {
      const existingLink = links.find((l) => l.id === linkId);
      if (existingLink) {
        setTitle(existingLink.title);
        setUrl(existingLink.url);
        setDescription(existingLink.description);
        setCollectionId(existingLink.collectionId);
        setTags(existingLink.tags || []);
        setFavorite(existingLink.favorite || false);
      }
    }
  }, [linkId, links]);

  const isValidUrl = (urlString: string) => {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  };

  const handleSave = () => {
    if (!url.trim()) {
      Alert.alert('Empty URL', 'Please enter a URL.');
      return;
    }

    const formattedUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;

    if (!isValidUrl(formattedUrl)) {
      Alert.alert('Invalid URL', 'Please enter a valid web address.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (linkId) {
        updateLink(linkId, title.trim(), formattedUrl, description.trim(), tags, collectionId, favorite).catch(console.error);
      } else {
        createLink(title.trim() || formattedUrl, formattedUrl, description.trim(), tags, collectionId, favorite).catch(console.error);
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save link');
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!linkId) return;
    Alert.alert('Delete Link', 'Are you sure you want to delete this link?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setIsSubmitting(true);
          try {
            deleteLink(linkId).catch(console.error);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete link');
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  const handleOpenLink = () => {
    const formattedUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    if (isValidUrl(formattedUrl)) {
      Linking.openURL(formattedUrl).catch(() => Alert.alert('Error', 'Could not open URL'));
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white dark:bg-stone-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-stone-100 dark:border-stone-850">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#78716c" />
          </TouchableOpacity>
          <View className="flex-row gap-x-2">
            {linkId && (
              <TouchableOpacity onPress={handleDelete} className="p-2">
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setFavorite(!favorite)} className="p-2 mr-2">
              <Ionicons name={favorite ? "star" : "star-outline"} size={24} color={favorite ? "#eab308" : "#a8a29e"} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={isSubmitting || !url.trim()}
              className={`bg-brand-500 px-4 py-2 rounded-full ${(isSubmitting || !url.trim()) ? 'opacity-50' : ''}`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-2">
          <TextInput
            placeholder="URL (e.g. https://example.com)"
            placeholderTextColor="#a8a29e"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            className="text-blue-600 dark:text-blue-400 text-xl font-medium mb-2 mt-2 bg-stone-50 dark:bg-stone-900 p-4 rounded-xl border border-stone-100 dark:border-stone-850"
          />

          {url.trim() !== '' && isValidUrl(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`) && (
             <TouchableOpacity 
               onPress={handleOpenLink}
               className="flex-row items-center justify-center mb-6 py-2 px-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 self-start"
             >
               <Ionicons name="open-outline" size={16} color="#3b82f6" />
               <Text className="text-blue-600 dark:text-blue-400 font-semibold ml-2">Open Link</Text>
             </TouchableOpacity>
          )}

          <TextInput
            placeholder="Title (optional)"
            placeholderTextColor="#a8a29e"
            value={title}
            onChangeText={setTitle}
            className="text-stone-900 dark:text-stone-100 text-2xl font-black mb-4"
          />

          <TouchableOpacity 
            onPress={() => setShowCollections(!showCollections)}
            className="flex-row items-center self-start bg-stone-100 dark:bg-stone-900 px-3 py-1.5 rounded-lg mb-6 border border-stone-200 dark:border-stone-800"
          >
            <Ionicons name="folder-outline" size={16} color="#78716c" />
            <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold ml-2 mr-1">
              {collectionId ? collections.find(c => c.id === collectionId)?.name || 'Select Collection' : 'No Collection'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#78716c" />
          </TouchableOpacity>

          {showCollections && (
            <View className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-850 mb-6 overflow-hidden shadow-sm">
              <TouchableOpacity 
                onPress={() => { setCollectionId(null); setShowCollections(false); }}
                className={`p-4 border-b border-stone-50 dark:border-stone-800 flex-row items-center justify-between ${collectionId === null ? 'bg-stone-50 dark:bg-stone-800/50' : ''}`}
              >
                <Text className="text-stone-700 dark:text-stone-200 font-medium">No Collection</Text>
                {collectionId === null && <Ionicons name="checkmark" size={18} color="#8b5cf6" />}
              </TouchableOpacity>
              {collections.map(c => (
                <TouchableOpacity 
                  key={c.id}
                  onPress={() => { setCollectionId(c.id); setShowCollections(false); }}
                  className={`p-4 border-b border-stone-50 dark:border-stone-800 flex-row items-center justify-between ${collectionId === c.id ? 'bg-stone-50 dark:bg-stone-800/50' : ''}`}
                >
                  <Text className="text-stone-700 dark:text-stone-200 font-medium">{c.name}</Text>
                  {collectionId === c.id && <Ionicons name="checkmark" size={18} color="#8b5cf6" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TagInput tags={tags} setTags={setTags} />

          <TextInput
            placeholder="Add a description or notes about this link..."
            placeholderTextColor="#a8a29e"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            className="text-stone-800 dark:text-stone-100 text-lg leading-7 pb-20"
            style={{ minHeight: 200 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
