import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { usePdfsStore } from '../store/pdfsStore';

export default function PdfDebugScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PdfDebug'>>();
  const { pdfId } = route.params;

  const pdf = usePdfsStore(state => state.pdfs.find(p => p.id === pdfId));

  if (!pdf) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-950 items-center justify-center">
        <Text className="text-stone-800 dark:text-stone-200">PDF not found</Text>
      </SafeAreaView>
    );
  }

  const extractedText = pdf.extractedText;
  const hasText = typeof extractedText === 'string';
  const textLength = hasText ? extractedText.length : 0;
  
  const firstChars = hasText ? extractedText.substring(0, 2000) : '';
  const lastChars = hasText && textLength > 2000 
    ? extractedText.substring(textLength - 1000) 
    : (hasText && textLength <= 2000 ? '' : '');

  const copyToClipboard = () => {
    Alert.alert('Manual Copy', 'Please long-press the text below to copy it natively.');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-stone-50 dark:bg-stone-950">
      <View className="flex-row items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Ionicons name="close" size={24} className="color-stone-800 dark:color-stone-200" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-stone-800 dark:text-stone-100">PDF Debug</Text>
        <TouchableOpacity 
          onPress={copyToClipboard} 
          className="px-4 py-1.5 rounded-full bg-blue-500"
        >
          <Text className="text-white font-bold">Copy</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 mb-6">
          <Text className="text-stone-500 dark:text-stone-400 font-bold mb-1">Title</Text>
          <Text className="text-stone-800 dark:text-stone-100 mb-4">{pdf.title || pdf.fileName}</Text>

          <Text className="text-stone-500 dark:text-stone-400 font-bold mb-1">extractedText exists?</Text>
          <Text className="text-stone-800 dark:text-stone-100 mb-4">{hasText ? 'Yes' : 'No (undefined/null)'}</Text>

          <Text className="text-stone-500 dark:text-stone-400 font-bold mb-1">Character Count</Text>
          <Text className="text-stone-800 dark:text-stone-100 mb-4">{textLength} characters</Text>
        </View>

        {hasText && (
          <View className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 mb-6">
            <Text className="text-brand-600 dark:text-brand-400 font-bold mb-2">First 2000 Characters</Text>
            <Text selectable={true} className="text-stone-800 dark:text-stone-200 font-mono text-xs bg-stone-100 dark:bg-stone-950 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
              {firstChars}
            </Text>

            {textLength > 2000 && (
              <>
                <Text className="text-brand-600 dark:text-brand-400 font-bold mt-6 mb-2">Last 1000 Characters</Text>
                <Text selectable={true} className="text-stone-800 dark:text-stone-200 font-mono text-xs bg-stone-100 dark:bg-stone-950 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
                  {lastChars}
                </Text>
              </>
            )}
          </View>
        )}
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
