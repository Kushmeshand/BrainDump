import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList } from '../../types/navigation';
import PressableScale from '../PressableScale';

export default function QuickActionCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const actions = [
    { title: 'New Note', icon: 'document-text', color: '#f59e0b', bgClass: 'bg-amber-50 dark:bg-amber-900/30', action: () => navigation.navigate('CreateNote', {}) },
    { title: 'Save Link', icon: 'link', color: '#3b82f6', bgClass: 'bg-blue-50 dark:bg-blue-900/30', action: () => navigation.navigate('CreateLink', {}) },
    { title: 'Upload Image', icon: 'image', color: '#10b981', bgClass: 'bg-emerald-50 dark:bg-emerald-900/30', action: handleImagePick },
    { title: 'Upload PDF', icon: 'document-outline', color: '#e11d48', bgClass: 'bg-rose-50 dark:bg-rose-900/30', action: handlePdfPick },
  ];

  return (
    <View className="mb-8">
      <Text className="text-stone-900 dark:text-stone-100 text-lg font-bold mb-4 px-1">Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
        <View className="flex-row px-1 pb-2 gap-4">
          {actions.map((item, index) => (
            <PressableScale 
              key={index} 
              onPress={item.action}
              className="bg-white dark:bg-stone-900 p-4 rounded-2xl items-center border border-stone-200 dark:border-stone-800 shadow-sm w-28"
            >
              <Ionicons name={item.icon as any} size={28} color={item.color} className="mb-3" />
              <Text className="text-stone-700 dark:text-stone-200 font-semibold text-xs text-center">{item.title}</Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
