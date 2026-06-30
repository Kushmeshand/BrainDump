import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme,
  Platform, UIManager, Alert, Share, Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIVivaResult } from '../../services/ai/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface VivaCardProps {
  vivaResult: AIVivaResult;
}

const FILTERS = ['All', 'Theory', 'Conceptual', 'Application', 'Interview'];

export default function VivaCard({ vivaResult }: VivaCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState('All');

  const getCategory = (q: string) => {
    const l = q.toLowerCase();
    if (l.includes('explain') || l.includes('what is') || l.includes('define')) return 'Theory';
    if (l.includes('difference') || l.includes('compare') || l.includes('why')) return 'Conceptual';
    if (l.includes('how would you') || l.includes('implement') || l.includes('example')) return 'Application';
    return 'Interview';
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Copied to clipboard');
  };

  const handleShare = async (text: string) => {
    try { await Share.share({ message: text }); } catch (e: any) { console.error(e); }
  };

  const C = {
    bg: isDark ? '#1c1917' : '#ffffff',
    surface: isDark ? '#292524' : '#f5f5f4',
    border: isDark ? '#44403c' : '#e7e5e4',
    text: isDark ? '#ffffff' : '#1c1917',
    subtext: isDark ? '#a8a29e' : '#78716c',
    activeBg: '#8b5cf6',
    activeText: '#ffffff',
    inactiveBg: isDark ? '#292524' : '#ffffff',
    inactiveText: isDark ? '#d6d3d1' : '#44403c',
    inactiveBorder: isDark ? '#44403c' : '#d6d3d1',
  };

  return (
    <View>
      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4, paddingRight: 8 }}>
          {FILTERS.map(chip => {
            const active = filter === chip;
            return (
              <TouchableOpacity
                key={chip}
                onPress={() => setFilter(chip)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? C.activeBg : C.inactiveBg,
                    borderColor: active ? C.activeBg : C.inactiveBorder,
                  }
                ]}
              >
                <Text style={[styles.filterChipText, { color: active ? C.activeText : C.inactiveText }]}>{chip}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Questions */}
      <View style={{ gap: 12 }}>
        {vivaResult.questions.map((q, i) => {
          const category = getCategory(q.question);
          if (filter !== 'All' && category !== filter) return null;
          const isOpen = expanded[i];

          return (
            <View key={i} style={[styles.card, { backgroundColor: C.bg, borderColor: isOpen ? '#8b5cf6' : C.border }]}>
              {/* Header */}
              <TouchableOpacity
                onPress={() => setExpanded(prev => ({ ...prev, [i]: !isOpen }))}
                activeOpacity={0.75}
                style={[styles.cardHeader, { backgroundColor: isOpen ? (isDark ? '#2d1d5e' : '#ede9fe') : 'transparent' }]}
              >
                <View style={[styles.qBadge, { backgroundColor: '#8b5cf6' }]}>
                  <Text style={styles.qBadgeText}>Q{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.questionText, { color: C.text }]}>{q.question}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <View style={[styles.chip, { backgroundColor: isDark ? '#44403c' : '#e7e5e4' }]}>
                      <Text style={[styles.chipText, { color: C.subtext }]}>{category.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.chip, { backgroundColor: isDark ? '#1a2e1a' : '#dcfce7', borderColor: isDark ? '#166534' : '#86efac' }]}>
                      <Text style={[styles.chipText, { color: isDark ? '#86efac' : '#166534' }]}>MEDIUM</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.expandIcon, { backgroundColor: isOpen ? '#8b5cf6' : C.surface }]}>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={isOpen ? '#ffffff' : C.subtext} />
                </View>
              </TouchableOpacity>

              {/* Answer */}
              {isOpen && (
                <View style={[styles.answerContainer, { borderTopColor: C.border }]}>
                  <View style={styles.answerLabelRow}>
                    <Ionicons name="sparkles" size={14} color="#06b6d4" />
                    <Text style={[styles.answerLabel, { color: '#06b6d4' }]}>  IDEAL ANSWER</Text>
                  </View>
                  <Text style={[styles.answerText, { color: isDark ? '#d6d3d1' : '#44403c' }]}>{q.answer}</Text>
                  <View style={[styles.actionRow, { borderTopColor: C.border }]}>
                    {[
                      { icon: 'copy-outline', label: 'Copy', action: () => handleCopy(`${q.question}\n\n${q.answer}`) },
                      { icon: 'bookmark-outline', label: 'Save', action: () => Alert.alert('Saved', 'Question bookmarked.') },
                      { icon: 'share-outline', label: 'Share', action: () => handleShare(`${q.question}\n\n${q.answer}`) },
                    ].map(({ icon, label, action }) => (
                      <TouchableOpacity key={label} onPress={action} style={[styles.actionBtn, { backgroundColor: C.surface, borderColor: C.border }]}>
                        <Ionicons name={icon as any} size={15} color={C.subtext} />
                        <Text style={[styles.actionBtnText, { color: C.subtext }]}> {label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 24, borderWidth: 1.5 },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  qBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  qBadgeText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },
  questionText: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  chipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  expandIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  answerContainer: { padding: 16, borderTopWidth: 1 },
  answerLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  answerLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  answerText: { fontSize: 15, lineHeight: 24, fontWeight: '500', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, paddingTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
});
