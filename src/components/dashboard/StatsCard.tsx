import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  total: number;
  collections: number;
  notes: number;
  links: number;
  pdfs: number;
  images: number;
}

export default function StatsCard({ total, collections, notes, links, pdfs, images }: Props) {
  const StatItem = ({ icon, color, count, label }: { icon: any, color: string, count: number, label: string }) => (
    <View className="flex-row items-center w-[48%] mb-4">
      <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${color}20` }}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View>
        <Text className="text-stone-800 dark:text-stone-100 font-bold text-base">{count}</Text>
        <Text className="text-stone-500 dark:text-stone-400 text-[10px] uppercase font-bold tracking-wider">{label}</Text>
      </View>
    </View>
  );

  return (
    <View className="mb-10">
      <Text className="text-stone-900 dark:text-stone-100 text-xl font-bold mb-5 px-2">Knowledge Vault</Text>
      <View className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden mx-1">
        
        <View className="flex-row justify-between mb-8 pb-8 border-b border-stone-100 dark:border-stone-800">
          <View>
            <Text className="text-stone-400 dark:text-stone-500 text-xs uppercase font-extrabold tracking-widest mb-1.5">Total Resources</Text>
            <Text className="text-stone-900 dark:text-stone-100 text-5xl font-black tracking-tight">{total}</Text>
          </View>
          <View className="items-end">
            <Text className="text-stone-400 dark:text-stone-500 text-xs uppercase font-extrabold tracking-widest mb-1.5">Collections</Text>
            <Text className="text-stone-900 dark:text-stone-100 text-5xl font-black tracking-tight">{collections}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between">
          <StatItem icon="document-text" color="#f59e0b" count={notes} label="Notes" />
          <StatItem icon="link" color="#3b82f6" count={links} label="Links" />
          <StatItem icon="document-outline" color="#e11d48" count={pdfs} label="PDFs" />
          <StatItem icon="image" color="#10b981" count={images} label="Images" />
        </View>

      </View>
    </View>
  );
}
