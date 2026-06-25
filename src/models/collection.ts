import { Ionicons } from '@expo/vector-icons';

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  colorClass: string;
  bgClass: string;
}

// Helper to generate consistent visual properties for collections
export const generateCollectionVisuals = (index: number) => {
  const visuals = [
    { icon: 'code-working', colorClass: '#3b82f6', bgClass: 'bg-blue-50 dark:bg-blue-950/20' },
    { icon: 'brush', colorClass: '#ec4899', bgClass: 'bg-pink-50 dark:bg-pink-950/20' },
    { icon: 'book', colorClass: '#8b5cf6', bgClass: 'bg-purple-50 dark:bg-purple-950/20' },
    { icon: 'restaurant', colorClass: '#f59e0b', bgClass: 'bg-amber-50 dark:bg-amber-950/20' },
    { icon: 'bulb', colorClass: '#10b981', bgClass: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { icon: 'cash', colorClass: '#06b6d4', bgClass: 'bg-cyan-50 dark:bg-cyan-950/20' },
    { icon: 'planet', colorClass: '#ef4444', bgClass: 'bg-red-50 dark:bg-red-950/20' },
    { icon: 'fitness', colorClass: '#f97316', bgClass: 'bg-orange-50 dark:bg-orange-950/20' },
  ];
  return visuals[index % visuals.length] as { icon: keyof typeof Ionicons.glyphMap; colorClass: string; bgClass: string };
};
