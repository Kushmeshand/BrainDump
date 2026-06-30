import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useCollectionsStore } from '../store/collectionsStore';
import { useNotesStore } from '../store/notesStore';
import { createNote, updateNote, deleteNote } from '../services/notes';
import { aiService } from '../services/ai/aiService';
import TagInput from '../components/TagInput';
import AIStudyAssistant from '../components/AIStudyAssistant';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateNote'>;

export default function CreateNoteScreen({ route, navigation }: Props) {
  const noteId = route.params?.noteId;
  const { collections } = useCollectionsStore();
  const { notes } = useNotesStore();
  const existingNote = noteId ? notes.find((n) => n.id === noteId) : undefined;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // AI local states
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  useEffect(() => {
    if (noteId && !isInitialized) {
      const existing = notes.find((n) => n.id === noteId);
      if (existing) {
        setTitle(existing.title);
        setContent(existing.content);
        setCollectionId(existing.collectionId);
        setTags(existing.tags || []);
        setFavorite(existing.favorite || false);
        setIsInitialized(true);
      }
    }
  }, [noteId, notes, isInitialized]);

  const handleAutoTitle = async () => {
    if (!content.trim()) return;
    setIsGeneratingTitle(true);
    try {
      const generated = await aiService.generateContent({
        description: content.trim(),
        userPrompt: "Generate a concise, catchy title (3-5 words) for this note content. Return ONLY the title string, no quotes or surrounding text."
      });
      if (generated && generated.trim()) {
        setTitle(generated.trim().replace(/^["']|["']$/g, ''));
      }
    } catch (error: any) {
      console.error('Error generating title:', error);
      Alert.alert('AI Error', error?.message || 'Failed to generate title. Check your internet connection and API key.');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!content.trim()) return;
    setIsSuggestingTags(true);
    try {
      const activeCollName = collectionId ? collections.find(c => c.id === collectionId)?.name : undefined;
      const suggestions = await aiService.suggestTags({
        title: title.trim() || undefined,
        description: content.trim(),
        collection: activeCollName || undefined,
        tags
      });
      const filtered = suggestions.filter(t => !tags.includes(t));
      setSuggestedTags(filtered);
      if (filtered.length === 0) {
        Alert.alert('AI Feedback', 'No new tags to suggest.');
      }
    } catch (error: any) {
      console.error('Error suggesting tags:', error);
      Alert.alert('AI Error', error?.message || 'Failed to suggest tags. Check your internet connection and API key.');
    } finally {
      setIsSuggestingTags(false);
    }
  };

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
        updateNote(noteId, title.trim(), content.trim(), collectionId, tags, favorite).catch(console.error);
      } else {
        createNote(title.trim(), content.trim(), collectionId, tags, favorite).catch(console.error);
      }
      
      // Dismiss screen immediately
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('MainTabs', { screen: 'Home' } as any);
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
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('MainTabs', { screen: 'Home' } as any);
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
            <TouchableOpacity onPress={() => setFavorite(!favorite)} className="p-2 mr-2">
              <Ionicons name={favorite ? "star" : "star-outline"} size={24} color={favorite ? "#eab308" : "#a8a29e"} />
            </TouchableOpacity>
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

          <View className="flex-row items-center gap-x-2 mb-6">
            <TouchableOpacity 
              onPress={() => setShowCollections(!showCollections)}
              className="flex-row items-center bg-stone-100 dark:bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800"
            >
              <Ionicons name="folder-outline" size={16} color="#78716c" />
              <Text className="text-stone-600 dark:text-stone-300 text-sm font-semibold ml-2 mr-1">
                {collectionId ? collections.find(c => c.id === collectionId)?.name || 'Select Collection' : 'No Collection'}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#78716c" />
            </TouchableOpacity>

            {content.trim().length > 10 && (
              <TouchableOpacity 
                onPress={handleAutoTitle}
                disabled={isGeneratingTitle}
                className="flex-row items-center bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 px-3 py-1.5 rounded-lg"
              >
                {isGeneratingTitle ? (
                  <ActivityIndicator size="small" color="#8b5cf6" />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={14} color="#8b5cf6" />
                    <Text className="text-brand-600 dark:text-brand-400 text-sm font-semibold ml-1.5">Auto-Title</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

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

          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400">Tags</Text>
            {content.trim().length > 10 && (
              <TouchableOpacity 
                onPress={handleSuggestTags}
                disabled={isSuggestingTags}
                className="flex-row items-center"
              >
                {isSuggestingTags ? (
                  <ActivityIndicator size="small" color="#8b5cf6" className="mr-1" />
                ) : (
                  <Ionicons name="sparkles-outline" size={14} color="#8b5cf6" className="mr-1" />
                )}
                <Text className="text-brand-600 dark:text-brand-400 text-sm font-semibold">Suggest Tags</Text>
              </TouchableOpacity>
            )}
          </View>

          <TagInput tags={tags} setTags={setTags} />

          {suggestedTags.length > 0 && (
            <View className="mb-6 -mt-2">
              <Text className="text-xs text-stone-400 dark:text-stone-500 mb-2">AI Suggestions (tap to add):</Text>
              <View className="flex-row flex-wrap gap-2">
                {suggestedTags.map((t, idx) => (
                  <TouchableOpacity
                    key={`sugg-${t}-${idx}`}
                    onPress={() => {
                      if (!tags.includes(t)) {
                        setTags([...tags, t]);
                      }
                      setSuggestedTags(suggestedTags.filter(st => st !== t));
                    }}
                    className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-1 rounded-full flex-row items-center"
                  >
                    <Text className="text-stone-600 dark:text-stone-300 text-xs">+{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TextInput
            placeholder="Start typing..."
            placeholderTextColor="#a8a29e"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            className="text-stone-800 dark:text-stone-100 text-lg leading-7"
            style={{ minHeight: 300 }}
          />

          {noteId && existingNote && (
            <View className="mt-4">
              <AIStudyAssistant
                type="note"
                id={noteId}
                aiGeneratedAt={existingNote.aiGeneratedAt}
                aiExplain={existingNote.aiExplain}
                aiQuiz={existingNote.aiQuiz}
                aiViva={existingNote.aiViva}
                aiRevisionNotes={existingNote.aiRevisionNotes}
                getContextInput={() => ({
                  title,
                  content,
                  tags,
                  collectionName: collectionId ? collections.find(c => c.id === collectionId)?.name : undefined,
                  extractedText: (existingNote as any).ocrText || (existingNote as any).ocr
                })}
              />
            </View>
          )}
          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
