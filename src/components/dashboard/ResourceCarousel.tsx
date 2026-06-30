import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import PressableScale from '../PressableScale';

interface ResourceItem {
  id: string;
  type: 'note' | 'link' | 'image' | 'pdf';
  title?: string;
  content?: string;
  url?: string;
  fileName?: string;
  description?: string;
  imageUrl?: string;
  updatedAt: number;
  createdAt: number;
  favorite: boolean;
  collectionId?: string | null;
}

interface Props {
  title: string;
  items: ResourceItem[];
  emptyMessage: string;
  onSeeAll?: () => void;
}

const CARD_WIDTH = 100; // fixed width for every card

export default function ResourceCarousel({ title, items, emptyMessage, onSeeAll }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (items.length === 0) {
    return null;
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'note':  return { icon: 'document-text',         color: '#eab308' };
      case 'link':  return { icon: 'link',                  color: '#3b82f6' };
      case 'pdf':   return { icon: 'document-text-outline', color: '#ef4444' };
      case 'image': return { icon: 'image',                 color: '#10b981' };
      default:      return { icon: 'document',              color: '#a8a29e' };
    }
  };

  return (
    <View style={{ marginBottom: 32 }}>
      {/* Section header — always has the same top clearance */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          paddingHorizontal: 4,
          // Extra top gap so previous carousel's titles don't crowd this header
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700' }}
              className="text-stone-900 dark:text-stone-100">
          {title}
        </Text>
        {onSeeAll && (
          <PressableScale onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#8b5cf6', fontWeight: '600', marginRight: 2 }}>See All</Text>
            <Ionicons name="arrow-forward" size={15} color="#8b5cf6" />
          </PressableScale>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
      >
        {items.map((item) => {
          const style = getTypeStyle(item.type);
          const displayTitle =
            item.title ||
            (item.type === 'note'  ? 'Untitled Note'  :
             item.type === 'image' ? 'Untitled Image' :
             item.type === 'pdf'   ? item.fileName    :
             item.url);

          return (
            <PressableScale
              key={item.id}
              onPress={() => {
                if      (item.type === 'note')  navigation.navigate('CreateNote',  { noteId:  item.id });
                else if (item.type === 'link')  navigation.navigate('CreateLink',  { linkId:  item.id });
                else if (item.type === 'image') navigation.navigate('CreateImage', { imageId: item.id });
                else if (item.type === 'pdf')   navigation.navigate('CreatePdf',   { pdfId:   item.id });
              }}
              style={{ width: 112, marginRight: 16 }}
              className="bg-white dark:bg-stone-900 p-4 rounded-2xl items-center border border-stone-200 dark:border-stone-800 shadow-sm"
            >
              {item.type === 'image' && item.imageUrl ? (
                <View className="w-10 h-10 rounded-lg overflow-hidden mb-3">
                  <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              ) : (
                <Ionicons name={style.icon as any} size={28} color={style.color} className="mb-3" />
              )}

              <Text
                numberOfLines={2}
                className="text-stone-700 dark:text-stone-200 font-semibold text-xs text-center"
                style={{ lineHeight: 16, minHeight: 32 }}
              >
                {displayTitle}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}
