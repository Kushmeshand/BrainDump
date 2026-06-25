import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'favorites_first' | 'recently_updated';
export type FilterOption = 'all' | 'notes' | 'links' | 'images' | 'pdfs' | 'favorites' | 'untagged' | 'no_collection';

interface FilterSortBarProps {
  currentSort: SortOption;
  setSort: (sort: SortOption) => void;
  currentFilter: FilterOption;
  setFilter: (filter: FilterOption) => void;
}

export default function FilterSortBar({ currentSort, setSort, currentFilter, setFilter }: FilterSortBarProps) {
  const [showSortModal, setShowSortModal] = useState(false);

  const filterOptions: { id: FilterOption, label: string, icon: any }[] = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'favorites', label: 'Favorites', icon: 'star' },
    { id: 'notes', label: 'Notes', icon: 'document-text' },
    { id: 'links', label: 'Links', icon: 'link' },
    { id: 'images', label: 'Images', icon: 'image' },
    { id: 'pdfs', label: 'PDFs', icon: 'document-outline' },
    { id: 'untagged', label: 'Untagged', icon: 'pricetag-outline' },
    { id: 'no_collection', label: 'No Folder', icon: 'folder-outline' },
  ];

  const sortOptions: { id: SortOption, label: string, icon: any }[] = [
    { id: 'newest', label: 'Newest First', icon: 'time' },
    { id: 'oldest', label: 'Oldest First', icon: 'time-outline' },
    { id: 'recently_updated', label: 'Recently Updated', icon: 'sync' },
    { id: 'favorites_first', label: 'Favorites First', icon: 'star' },
    { id: 'alphabetical', label: 'Alphabetical (A-Z)', icon: 'text' },
  ];

  const currentSortLabel = sortOptions.find(o => o.id === currentSort)?.label || 'Newest First';

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-stone-800 dark:text-stone-200 font-bold text-sm">Filter & Sort</Text>
        <TouchableOpacity 
          onPress={() => setShowSortModal(true)}
          className="flex-row items-center bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-full"
        >
          <Ionicons name="swap-vertical" size={14} color="#8b5cf6" />
          <Text className="text-brand-600 dark:text-brand-400 font-semibold text-xs ml-1">{currentSortLabel}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {filterOptions.map(option => {
          const isActive = currentFilter === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => setFilter(option.id)}
              className={`flex-row items-center px-4 py-2 rounded-full border ${isActive ? 'bg-brand-500 border-brand-500' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}
            >
              <Ionicons 
                name={option.icon} 
                size={14} 
                color={isActive ? '#ffffff' : '#78716c'} 
              />
              <Text className={`font-semibold text-sm ml-2 ${isActive ? 'text-white' : 'text-stone-600 dark:text-stone-400'}`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={showSortModal} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity 
            className="absolute inset-0" 
            activeOpacity={1} 
            onPress={() => setShowSortModal(false)} 
          />
          <View className="bg-white dark:bg-stone-900 rounded-t-3xl pt-6 pb-10 px-6">
            <Text className="text-stone-900 dark:text-white text-xl font-bold mb-4">Sort By</Text>
            {sortOptions.map(option => {
              const isActive = currentSort === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => {
                    setSort(option.id);
                    setShowSortModal(false);
                  }}
                  className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${isActive ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                >
                  <View className="flex-row items-center">
                    <Ionicons name={option.icon} size={20} color={isActive ? '#8b5cf6' : '#a8a29e'} />
                    <Text className={`ml-3 font-semibold text-base ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-700 dark:text-stone-300'}`}>
                      {option.label}
                    </Text>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}
