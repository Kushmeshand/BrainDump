import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  quizzes: number;
  revisionNotes: number;
}

export default function InsightsCard({ quizzes, revisionNotes }: Props) {
  const InsightItem = ({ icon, color, count, label }: { icon: any, color: string, count: number, label: string }) => (
    <View className="flex-row items-center justify-between p-4 border-b border-stone-50 dark:border-stone-850">
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${color}20` }}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text className="text-stone-700 dark:text-stone-200 font-semibold">{label}</Text>
      </View>
      <View className="bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
        <Text className="text-stone-800 dark:text-stone-100 font-bold">{count}</Text>
      </View>
    </View>
  );

  return (
    <View className="mb-12">
      <Text className="text-stone-900 dark:text-stone-100 text-xl font-bold mb-5 px-2">AI Insights Generated</Text>
      <View className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden mx-1">
        <InsightItem icon="help-circle" color="#eab308" count={quizzes} label="Quizzes" />
        {/* Render last item without bottom border by using custom View */}
        <View className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#14b8a620' }}>
              <Ionicons name="book" size={16} color="#14b8a6" />
            </View>
            <Text className="text-stone-700 dark:text-stone-200 font-semibold">Revision Notes</Text>
          </View>
          <View className="bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
            <Text className="text-stone-800 dark:text-stone-100 font-bold">{revisionNotes}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
