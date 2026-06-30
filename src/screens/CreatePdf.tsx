import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useCollectionsStore } from '../store/collectionsStore';
import { usePdfsStore } from '../store/pdfsStore';
import { createPdf, updatePdf, deletePdf } from '../services/pdfs';
import { aiService } from '../services/ai/aiService';
import TagInput from '../components/TagInput';
import AIStudyAssistant from '../components/AIStudyAssistant';

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
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);

  // AI local states
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleSuggestTags = async () => {
    const activeFileName = existingPdf?.fileName || (selectedUris.length > 0 ? selectedUris[0].split('/').pop() : '');
    const activeTitle = title.trim() || activeFileName || 'Document';

    setIsSuggestingTags(true);
    try {
      const activeCollName = collectionId ? collections.find(c => c.id === collectionId)?.name : undefined;
      const suggestions = await aiService.suggestTags({
        title: activeTitle,
        description: description.trim() || `PDF document file: ${activeFileName}`,
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

  const handleGenerateSummary = async () => {
    const activeFileName = existingPdf?.fileName || (selectedUris.length > 0 ? selectedUris[0].split('/').pop() : '');
    const activeTitle = title.trim() || activeFileName || 'Document';

    setIsGeneratingSummary(true);
    try {
      const summary = await aiService.generateContent({
        title: activeTitle,
        description: description.trim() || undefined,
        userPrompt: `This is a study material PDF named "${activeFileName}". Generate a brief 1-2 sentence description summary and potential learning points for this document based on its title and name, suggesting what kind of content a student or developer would find inside.`
      });
      if (summary) {
        setDescription(summary.trim());
      }
    } catch (error: any) {
      console.error('Error generating summary:', error);
      Alert.alert('AI Error', error?.message || 'Failed to generate summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSave = async () => {
    if (!existingPdf && selectedUris.length === 0) return;
    setIsUploading(true);
    try {
      if (existingPdf) {
        const finalTitle = title.trim() || 'Untitled PDF';
        await updatePdf(existingPdf.id, finalTitle, description, collectionId, tags, favorite);
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MainTabs', { screen: 'Home' } as any);
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
              (progress) => setUploadProgress(progress),
              (status) => setOcrStatus(status)
            );
        }
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MainTabs', { screen: 'Home' } as any);
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
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('MainTabs', { screen: 'Home' } as any);
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
            <View className="flex-row items-center justify-between mb-1 ml-1">
              <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400">Tags</Text>
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
            </View>
            <TagInput tags={tags} setTags={setTags} />

            {suggestedTags.length > 0 && (
              <View className="mb-4 -mt-4">
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
          </View>

          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-1 ml-1">
              <Text className="text-sm font-semibold text-stone-600 dark:text-stone-400">Description (Optional)</Text>
              <TouchableOpacity 
                onPress={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="flex-row items-center"
              >
                {isGeneratingSummary ? (
                  <ActivityIndicator size="small" color="#8b5cf6" className="mr-1" />
                ) : (
                  <Ionicons name="sparkles-outline" size={14} color="#8b5cf6" className="mr-1" />
                )}
                <Text className="text-brand-600 dark:text-brand-400 text-sm font-semibold">AI Summarize</Text>
              </TouchableOpacity>
            </View>
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

          {/* Delete Button (Edit Mode Only) */}
          {existingPdf && (
            <TouchableOpacity 
              onPress={handleDelete}
              className="mt-4 bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex-row items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="ml-2 text-red-500 font-bold">Delete PDF</Text>
            </TouchableOpacity>
          )}

          {/* TEMPORARY DEBUG BUTTON */}
          {existingPdf && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('PdfDebug', { pdfId: existingPdf.id })}
              className="mt-4 bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-100 dark:border-purple-900/50 flex-row items-center justify-center"
            >
              <Ionicons name="bug-outline" size={20} color="#a855f7" />
              <Text className="ml-2 text-purple-600 font-bold">View Extracted Text (Debug)</Text>
            </TouchableOpacity>
          )}

          {existingPdf && existingPdf.extractedText === undefined && (
            <View className="mt-6 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                <Text className="ml-2 text-blue-700 dark:text-blue-400 font-bold">PDF Text Missing</Text>
              </View>
              <Text className="text-blue-600 dark:text-blue-300 text-sm mb-3">
                This PDF was uploaded before text extraction was supported. AI cannot analyze it yet.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    Alert.alert('Reprocessing', 'Downloading and extracting text...');
                    const { extractTextFromPdf } = await import('../utils/pdfParser');
                    
                    let text = await extractTextFromPdf(existingPdf.pdfUrl);
                    
                    const cleanText = text.trim().replace(/\s+/g, '');
                    if (cleanText.length < 50 && existingPdf.pageCount && existingPdf.pageCount > 0) {
                      Alert.alert('OCR Required', `Scanning ${existingPdf.pageCount} pages... This may take a minute.`);
                      const { recognizeText } = await import('expo-mlkit-ocr');
                      const FileSystem: any = await import('expo-file-system/legacy');
                      const { downloadAsync, deleteAsync, cacheDirectory } = FileSystem;
                      
                      // Download the PDF locally first to process pages
                      const localPdfUri = cacheDirectory + `temp_reprocess_${existingPdf.id}.pdf`;
                      await downloadAsync(existingPdf.pdfUrl, localPdfUri);
                      
                      const ExpoPdfToImageModule = (await import('expo-pdf-to-image')).default;
                      let fullOcrText = '';
                      
                      console.log(`[PDF_EXTRACTION] Page rendering started`);
                      let imagePaths: string[] = [];
                      try {
                        imagePaths = await ExpoPdfToImageModule.convertPdfToImages(localPdfUri);
                      } catch (err) {
                        console.error('[PDF_EXTRACTION] Failed to render PDF images:', err);
                      }
                      
                      if (imagePaths && imagePaths.length > 0) {
                        console.log(`[PDF_EXTRACTION] Rendered ${imagePaths.length} pages to disk successfully.`);
                        for (let pageIndex = 0; pageIndex < imagePaths.length; pageIndex++) {
                          const pageUri = imagePaths[pageIndex];
                          try {
                            console.log(`[PDF_EXTRACTION] OCR started (Page ${pageIndex + 1})`);
                            const ocrResult = await recognizeText(pageUri);
                            const pageText = ocrResult.text || '';
                            
                            console.log(`[PDF_EXTRACTION] OCR completed (Page ${pageIndex + 1})`);
                            console.log(`[PDF_EXTRACTION] Characters extracted: ${pageText.length}`);
                            
                            if (pageText) {
                              fullOcrText += pageText + '\n\n';
                            }
                            console.log(`[PDF_EXTRACTION] Running total characters: ${fullOcrText.length}`);
                            
                            await deleteAsync(pageUri, { idempotent: true });
                            console.log(`[PDF_EXTRACTION] Temporary file deleted: ${pageUri}`);
                          } catch (e) {
                            console.error(`[PDF_EXTRACTION] Failed to OCR page ${pageIndex + 1}:`, e);
                          }
                        }
                      } else {
                         console.log('[PDF_EXTRACTION] No pages could be rendered.');
                      }
                      
                      await deleteAsync(localPdfUri, { idempotent: true });
                      
                      if (fullOcrText.trim().length > 0) {
                        if (fullOcrText.trim().length < 20) {
                          text = "No readable text could be detected from this scan.";
                          console.log(`[PDF_EXTRACTION] Text validation failed. Applied fallback message.`);
                        } else {
                          text = fullOcrText.trim();
                        }
                      } else {
                        text = "No readable text could be detected from this scan.";
                      }
                      console.log(`[PDF_EXTRACTION] Merged text length: ${text.length}`);
                    }
                    
                    const { updateDoc, doc } = await import('firebase/firestore');
                    const { db } = await import('../services/firebase');
                    
                    await updateDoc(doc(db, 'pdfs', existingPdf.id), { extractedText: text });
                    
                    const store = usePdfsStore.getState();
                    store.setPdfs(store.pdfs.map(p => p.id === existingPdf.id ? { ...p, extractedText: text } : p));
                    
                    Alert.alert('Success', 'PDF text extracted successfully.');
                  } catch (e: any) {
                    Alert.alert('Error', 'Failed to extract text: ' + e.message);
                  }
                }}
                className="bg-blue-500 py-2 rounded-lg items-center"
              >
                <Text className="text-white font-bold">Reprocess PDF for AI</Text>
              </TouchableOpacity>
            </View>
          )}

          {existingPdf && existingPdf.extractedText === '' && (
            <View className="mt-6 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 flex-row items-center">
              <Ionicons name="warning-outline" size={24} color="#d97706" />
              <Text className="flex-1 ml-3 text-amber-800 dark:text-amber-400 text-sm">
                This PDF appears to be a scanned image. OCR is currently required for AI analysis.
              </Text>
            </View>
          )}

          {pdfId && existingPdf && (
            <View className="mt-4">
              <AIStudyAssistant
                type="pdf"
                id={pdfId}
                aiGeneratedAt={existingPdf.aiGeneratedAt}
                aiExplain={existingPdf.aiExplain}
                aiQuiz={existingPdf.aiQuiz}
                aiViva={existingPdf.aiViva}
                aiRevisionNotes={existingPdf.aiRevisionNotes}
                getContextInput={() => ({
                  title,
                  description,
                  tags,
                  collectionName: collectionId ? collections.find(c => c.id === collectionId)?.name : undefined,
                  extractedText: (existingPdf as any).ocrText || (existingPdf as any).ocr || (existingPdf as any).extractedText || (existingPdf as any).content
                })}
              />
            </View>
          )}
        </View>
        <View className="h-20" />
      </ScrollView>

      {isUploading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <View className="bg-white dark:bg-stone-900 p-6 rounded-2xl items-center w-3/4 max-w-xs shadow-2xl">
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text className="text-stone-800 dark:text-stone-100 font-bold mt-4 text-lg">
              {existingPdf ? 'Updating...' : `Uploading ${uploadIndex} of ${selectedUris.length}...`}
            </Text>
            {!existingPdf && !ocrStatus && (
              <View className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full mt-4 overflow-hidden">
                <View 
                  className="h-full bg-brand-500 rounded-full" 
                  style={{ width: `${Math.max(uploadProgress, 5)}%` }} 
                />
              </View>
            )}
            {!existingPdf && !ocrStatus && (
              <Text className="text-stone-500 dark:text-stone-400 text-xs mt-2">{Math.round(uploadProgress)}% Complete</Text>
            )}
            {ocrStatus && (
              <Text className="text-brand-500 font-medium text-sm mt-3 text-center px-4">{ocrStatus}</Text>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
