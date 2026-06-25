import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
}

export default function TagInput({ tags, setTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (text: string) => {
    const cleaned = text.trim().toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setInputValue('');
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === ' ' || e.nativeEvent.key === 'Enter') {
      addTag(inputValue);
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center bg-stone-100 dark:bg-stone-900 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800">
        <Ionicons name="pricetag-outline" size={16} color="#78716c" />
        <TextInput
          value={inputValue}
          onChangeText={(text) => {
            if (text.endsWith(' ')) {
              addTag(text);
            } else {
              setInputValue(text);
            }
          }}
          onSubmitEditing={() => addTag(inputValue)}
          onKeyPress={handleKeyPress}
          placeholder="Add tags (space to separate)"
          placeholderTextColor="#a8a29e"
          className="flex-1 ml-2 text-stone-800 dark:text-stone-100 py-1"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
        />
      </View>
      
      {tags.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-row"
          keyboardShouldPersistTaps="always"
        >
          {tags.map((tag, index) => (
            <View 
              key={`${tag}-${index}`} 
              className="flex-row items-center bg-brand-100 dark:bg-brand-900/30 px-3 py-1.5 rounded-full mr-2"
            >
              <Text className="text-brand-700 dark:text-brand-300 text-xs font-semibold mr-1">#{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(index)} className="ml-1">
                <Ionicons name="close-circle" size={14} color="#8b5cf6" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
