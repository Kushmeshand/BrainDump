import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Stores
import { useNotesStore } from '../store/notesStore';
import { useLinksStore } from '../store/linksStore';
import { useImagesStore } from '../store/imagesStore';
import { usePdfsStore } from '../store/pdfsStore';
import { useCollectionsStore } from '../store/collectionsStore';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import ResourceCarousel from '../components/dashboard/ResourceCarousel';
import StatsCard from '../components/dashboard/StatsCard';
import InsightsCard from '../components/dashboard/InsightsCard';
import EmptyDashboard from '../components/dashboard/EmptyDashboard';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);

  const { notes } = useNotesStore();
  const { links } = useLinksStore();
  const { images } = useImagesStore();
  const { pdfs } = usePdfsStore();
  const { collections } = useCollectionsStore();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Real-time subscriptions are active, so we just simulate network delay for UI feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Aggregate all resources
  const allResources = [
    ...notes.map(n => ({ ...n, type: 'note' as const })),
    ...links.map(l => ({ ...l, type: 'link' as const })),
    ...images.map(img => ({ ...img, type: 'image' as const })),
    ...pdfs.map(pdf => ({ ...pdf, type: 'pdf' as const }))
  ];

  const totalResources = allResources.length;

  if (totalResources === 0) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-stone-50 dark:bg-stone-950">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
        >
          <View className="px-4 pt-6">
            <DashboardHeader />
          </View>
          <EmptyDashboard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Sorting Logic
  const continueStudying = [...allResources]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);

  const recentlyAdded = [...allResources]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  const favorites = allResources
    .filter(r => r.favorite)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // AI Insights calculation
  const aiQuizzesCount = allResources.filter(r => (r as any).aiQuiz).length;
  const aiRevisionNotesCount = allResources.filter(r => (r as any).aiRevisionNotes).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50 dark:bg-stone-950">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 32 }} 
        className="px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} className="mb-6">
          <DashboardHeader />
          <QuickActionCard />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200).springify()} className="mb-6">
          <ResourceCarousel 
            title="Continue Studying" 
            items={continueStudying} 
            emptyMessage="Nothing to study right now." 
          />
          <ResourceCarousel 
            title="Recently Added" 
            items={recentlyAdded} 
            emptyMessage="No recent items." 
            onSeeAll={() => navigation.navigate('MainTabs', { screen: 'Search' } as any)}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300).springify()}>
          <StatsCard 
            total={totalResources}
            collections={collections.length}
            notes={notes.length}
            links={links.length}
            pdfs={pdfs.length}
            images={images.length}
          />
          <InsightsCard 
            quizzes={aiQuizzesCount}
            revisionNotes={aiRevisionNotesCount}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
