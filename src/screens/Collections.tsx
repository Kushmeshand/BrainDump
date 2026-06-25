import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCollectionsStore } from '../store/collectionsStore';
import { useNotesStore } from '../store/notesStore';
import { useLinksStore } from '../store/linksStore';
import { useImagesStore } from '../store/imagesStore';
import { usePdfsStore } from '../store/pdfsStore';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { createCollection, updateCollection, deleteCollection } from '../services/collections';

export default function CollectionsScreen() {
  const { collections } = useCollectionsStore();
  const { notes } = useNotesStore();
  const { links } = useLinksStore();
  const { images } = useImagesStore();
  const { pdfs } = usePdfsStore();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setCollectionName('');
    setModalVisible(true);
  };

  const openEditModal = (id: string, currentName: string) => {
    setEditingId(id);
    setCollectionName(currentName);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!collectionName.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        updateCollection(editingId, collectionName.trim()).catch(console.error);
      } else {
        createCollection(collectionName.trim()).catch(console.error);
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save collection');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            try {
              deleteCollection(id).catch(console.error);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete collection');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-stone-50 dark:bg-stone-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 24 }} className="flex-1 px-4">
        {/* Header Info */}
        <View className="mb-6 px-1 flex-row justify-between items-center">
          <View>
            <Text className="text-stone-400 dark:text-stone-500 text-xs font-semibold uppercase tracking-wider">Organize Your Vault</Text>
            <Text className="text-stone-900 dark:text-stone-100 text-2xl font-black mt-1">
              {collections.length} {collections.length === 1 ? 'Collection' : 'Collections'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={openAddModal}
            className="w-10 h-10 bg-brand-500 rounded-full items-center justify-center shadow-lg shadow-brand-500/20"
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Grid of folders */}
        <View className="flex-row flex-wrap justify-between gap-y-4 mb-12">
          {[...collections].sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => navigation.navigate('CollectionDetails', { collectionId: item.id })}
              onLongPress={() => handleDelete(item.id)}
              className="w-[48%] bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm"
            >
              {/* Folder Icon Bubble */}
              <View className={`w-12 h-12 rounded-2xl ${item.bgClass} items-center justify-center mb-4`}>
                <Ionicons name={item.icon} size={24} color={item.colorClass} />
              </View>

              {/* Folder Info */}
              <Text className="text-stone-800 dark:text-stone-100 font-bold text-base leading-5 mb-1" numberOfLines={2}>
                {item.name}
              </Text>
              <Text className="text-stone-400 dark:text-stone-500 text-xs">
                {notes.filter(n => n.collectionId === item.id).length + links.filter(l => l.collectionId === item.id).length + images.filter(img => img.collectionId === item.id).length + pdfs.filter(pdf => pdf.collectionId === item.id).length} assets
              </Text>

              {/* Folder Action Pin */}
              <View className="flex-row justify-between items-center mt-4">
                <View className="flex-row -space-x-1.5 overflow-hidden">
                  <View className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 border border-white dark:border-stone-900 items-center justify-center">
                    <Ionicons name="link" size={8} color="#7c3aed" />
                  </View>
                  <View className="w-5 h-5 rounded-full bg-stone-300 dark:bg-stone-600 border border-white dark:border-stone-900 items-center justify-center">
                    <Ionicons name="document-text" size={8} color="#7c3aed" />
                  </View>
                </View>
                <TouchableOpacity onPress={() => openEditModal(item.id, item.name)} className="p-1">
                  <Ionicons name="pencil" size={14} color="#a8a29e" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {collections.length === 0 && (
            <View className="w-full items-center justify-center py-10">
              <Text className="text-stone-400">No collections yet. Tap the + to create one!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="bg-white dark:bg-stone-900 w-full rounded-3xl p-6 border border-stone-200 dark:border-stone-800">
            <Text className="text-xl font-bold text-stone-900 dark:text-white mb-4">
              {editingId ? 'Edit Collection' : 'New Collection'}
            </Text>
            
            <TextInput
              className="bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-white px-4 py-3 rounded-xl mb-6 font-medium"
              placeholder="Collection Name"
              placeholderTextColor="#a8a29e"
              value={collectionName}
              onChangeText={setCollectionName}
              autoFocus
            />

            <View className="flex-row justify-end gap-x-3">
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="px-5 py-3 rounded-xl bg-stone-100 dark:bg-stone-800"
              >
                <Text className="text-stone-600 dark:text-stone-300 font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleSave}
                disabled={isSubmitting || !collectionName.trim()}
                className={`px-5 py-3 rounded-xl bg-brand-500 ${(!collectionName.trim() || isSubmitting) ? 'opacity-50' : ''}`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
