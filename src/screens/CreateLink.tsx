import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useCollectionsStore } from '../store/collectionsStore';
import { useLinksStore } from '../store/linksStore';
import { createLink, updateLink, deleteLink } from '../services/links';
import { aiService } from '../services/ai/aiService';
import TagInput from '../components/TagInput';
import AIStudyAssistant from '../components/AIStudyAssistant';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateLink'>;

export default function CreateLinkScreen({ route, navigation }: Props) {
  const linkId = route.params?.linkId;
  const { collections } = useCollectionsStore();
  const { links } = useLinksStore();
  const existingLink = linkId ? links.find((l) => l.id === linkId) : undefined;

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // AI local states
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (linkId && !isInitialized) {
      const existing = links.find((l) => l.id === linkId);
      if (existing) {
        setTitle(existing.title);
        setUrl(existing.url);
        setDescription(existing.description);
        setCollectionId(existing.collectionId);
        setTags(existing.tags || []);
        setFavorite(existing.favorite || false);
        setIsInitialized(true);
      }
    }
  }, [linkId, links, isInitialized]);

  const isValidUrl = (urlString: string) => {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  };

  const cleanHtml = (html: string) => {
    // Basic title extractor
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const extractedTitle = titleMatch ? titleMatch[1].trim() : '';

    // Meta description extractor
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
                          html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

    // Strip scripts and styles
    let bodyText = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
    
    // Strip HTML tags
    bodyText = bodyText.replace(/<[^>]+>/g, ' ');
    
    // Normalize whitespaces
    bodyText = bodyText.replace(/\s+/g, ' ').trim();

    // Take a snippet of the body text (first 2500 chars)
    const textSnippet = bodyText.slice(0, 2500);

    return {
      title: extractedTitle,
      metaDesc,
      textSnippet
    };
  };

  const handleAiAutoFill = async () => {
    const formattedUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    if (!isValidUrl(formattedUrl)) return;

    setIsGeneratingAi(true);
    try {
      // Fetch webpage content
      const response = await fetch(formattedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
        }
      });
      const html = await response.text();
      const parsed = cleanHtml(html);

      const pageTitle = parsed.title || title || 'Webpage';
      const pageDesc = parsed.metaDesc || parsed.textSnippet || 'No content found';

      // 1. Suggest tags
      const activeCollName = collectionId ? collections.find(c => c.id === collectionId)?.name : undefined;
      const suggTags = await aiService.suggestTags({
        title: pageTitle,
        description: pageDesc,
        collection: activeCollName || undefined
      });

      // 2. Generate a 2-3 sentence summary
      const summary = await aiService.generateContent({
        title: pageTitle,
        extractedText: pageDesc,
        userPrompt: "Write a clear, structured, 2-3 sentence summary of this page's content for my personal reference."
      });

      // Set states
      if (pageTitle && !title.trim()) {
        setTitle(pageTitle);
      }
      if (summary) {
        setDescription(summary.trim());
      }
      if (suggTags.length > 0) {
        // Merge suggested tags, filtering duplicates
        setTags(Array.from(new Set([...tags, ...suggTags])));
      }

      Alert.alert('AI Success', 'Link page processed! Title, summary, and tags suggested successfully.');
    } catch (error: any) {
      console.error('Error auto-filling link with AI:', error);
      Alert.alert('AI Process Failed', 'Could not scrape page details directly. Make sure you have a valid Groq API key configured and try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!title.trim() && !description.trim()) {
      Alert.alert('Details Required', 'Please enter a title or description first.');
      return;
    }
    setIsSuggestingTags(true);
    try {
      const activeCollName = collectionId ? collections.find(c => c.id === collectionId)?.name : undefined;
      const suggestions = await aiService.suggestTags({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
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
      Alert.alert('AI Error', error?.message || 'Failed to suggest tags.');
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleSummarizeDescription = async () => {
    if (!description.trim()) return;
    setIsSummarizing(true);
    try {
      const summary = await aiService.generateSummary(description.trim());
      if (summary) {
        setDescription(summary.trim());
      }
    } catch (error: any) {
      console.error('Error summarizing description:', error);
      Alert.alert('AI Error', error?.message || 'Failed to summarize description.');
    } finally {
      setIsSummarizing(false);
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
      
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('MainTabs', { screen: 'Home' } as any);
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
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('MainTabs', { screen: 'Home' } as any);
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
             <View className="flex-row gap-x-2 mb-6">
               <TouchableOpacity 
                 onPress={handleOpenLink}
                 className="flex-row items-center justify-center py-2 px-4 rounded-lg bg-blue-50 dark:bg-blue-900/30"
               >
                 <Ionicons name="open-outline" size={16} color="#3b82f6" />
                 <Text className="text-blue-600 dark:text-blue-400 font-semibold ml-2">Open Link</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                 onPress={handleAiAutoFill}
                 disabled={isGeneratingAi}
                 className="flex-row items-center justify-center py-2 px-4 rounded-lg bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50"
               >
                 {isGeneratingAi ? (
                   <ActivityIndicator size="small" color="#8b5cf6" />
                 ) : (
                   <>
                     <Ionicons name="sparkles-outline" size={16} color="#8b5cf6" />
                     <Text className="text-brand-600 dark:text-brand-400 font-semibold ml-2">AI Auto-Fill</Text>
                   </>
                 )}
               </TouchableOpacity>
             </View>
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

          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400">Tags</Text>
            {title.trim().length > 0 && (
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

          <View className="flex-row items-center justify-between mb-2 mt-2">
            <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400">Description</Text>
            {description.trim().length > 20 && (
              <TouchableOpacity 
                onPress={handleSummarizeDescription}
                disabled={isSummarizing}
                className="flex-row items-center"
              >
                {isSummarizing ? (
                  <ActivityIndicator size="small" color="#8b5cf6" className="mr-1" />
                ) : (
                  <Ionicons name="sparkles-outline" size={14} color="#8b5cf6" className="mr-1" />
                )}
                <Text className="text-brand-600 dark:text-brand-400 text-sm font-semibold">AI Summarize</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            placeholder="Add a description or notes about this link..."
            placeholderTextColor="#a8a29e"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            className="text-stone-800 dark:text-stone-100 text-lg leading-7"
            style={{ minHeight: 200 }}
          />

          {linkId && existingLink && (
            <View className="mt-4">
              <AIStudyAssistant
                type="link"
                id={linkId}
                aiGeneratedAt={existingLink.aiGeneratedAt}
                aiExplain={existingLink.aiExplain}
                aiQuiz={existingLink.aiQuiz}
                aiViva={existingLink.aiViva}
                aiRevisionNotes={existingLink.aiRevisionNotes}
                getContextInput={() => ({
                  title,
                  description,
                  url,
                  tags,
                  collectionName: collectionId ? collections.find(c => c.id === collectionId)?.name : undefined,
                  extractedText: (existingLink as any).ocrText || (existingLink as any).ocr
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
