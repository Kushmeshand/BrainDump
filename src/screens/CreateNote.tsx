import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useCollectionsStore } from '../store/collectionsStore';
import { useNotesStore } from '../store/notesStore';
import { createNote, updateNote, deleteNote } from '../services/notes';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateNote'>;

export default function CreateNoteScreen({ route, navigation }: Props) {
  const noteId = route.params?.noteId;
  const { collections } = useCollectionsStore();
  const { notes } = useNotesStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCollections, setShowCollections] = useState(false);

  useEffect(() => {
    if (noteId) {
      const existingNote = notes.find((n) => n.id === noteId);
      if (existingNote) {
        setTitle(existingNote.title);
        setContent(existingNote.content);
        setCollectionId(existingNote.collectionId);
      }
    }
  }, [noteId, notes]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Note', 'Please enter a title or content before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Fire and forget (Optimistic Update)
      // Firestore will update the local listener immediately, so we don't need to await the server response.
      if (noteId) {
        updateNote(noteId, title.trim(), content.trim(), collectionId).catch(console.error);
      } else {
        createNote(title.trim(), content.trim(), collectionId).catch(console.error);
      }
      
      // Dismiss screen immediately
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!noteId) return;
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setIsSubmitting(true);
          try {
            deleteNote(noteId).catch(console.error);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete note');
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white dark:bg-stone-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-stone-100 dark:border-stone-850">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#78716c" />
          </TouchableOpacity>
          <View className="flex-row gap-x-2">
            {noteId && (
              <TouchableOpacity onPress={handleDelete} className="p-2">
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={isSubmitting || (!title.trim() && !content.trim())}
              className={`bg-brand-500 px-4 py-2 rounded-full ${(isSubmitting || (!title.trim() && !content.trim())) ? 'opacity-50' : ''}`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-4 py-2">
          <TextInput
            placeholder="Title"
            placeholderTextColor="#a8a29e"
            value={title}
            onChangeText={setTitle}
            className="text-stone-900 dark:text-stone-100 text-3xl font-black mb-4 mt-2"
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

          <TextInput
            placeholder="Start typing..."
            placeholderTextColor="#a8a29e"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            className="text-stone-800 dark:text-stone-100 text-lg leading-7 pb-20"
            style={{ minHeight: 300 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
