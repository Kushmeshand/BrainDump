import React from 'react';
import { View, Text, StyleSheet, useColorScheme, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIRevisionNotesResult } from '../../services/ai/types';

interface RevisionNotesCardProps {
  revisionNotes: AIRevisionNotesResult;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Section header shared component ────────────────────────────────────────
function SectionHeader({ icon, color, title, isDark }: { icon: IoniconName; color: string; title: string; isDark: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.iconBubble, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1c1917' }]}>{title}</Text>
    </View>
  );
}

// ─── Bullet row shared component ─────────────────────────────────────────────
function BulletRow({ text, color, textColor }: { text: string; color: string; textColor: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: color }]} />
      <Text style={[styles.bulletText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

export default function RevisionNotesCard({ revisionNotes }: RevisionNotesCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const C = {
    bg: isDark ? '#1c1917' : '#ffffff',
    surface: isDark ? '#292524' : '#f5f5f4',
    border: isDark ? '#44403c' : '#e7e5e4',
    text: isDark ? '#ffffff' : '#1c1917',
    subtext: isDark ? '#a8a29e' : '#78716c',
  };

  return (
    <View style={{ gap: 32 }}>

      {/* ── CHAPTER OVERVIEW ── */}
      {!!(revisionNotes.overview) && (
        <View style={[styles.overviewCard, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff', borderColor: isDark ? '#4338ca' : '#c7d2fe' }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBubble, { backgroundColor: '#6366f122' }]}>
              <Ionicons name="book-outline" size={16} color="#6366f1" />
            </View>
            <Text style={[styles.sectionTitle, { color: isDark ? '#c7d2fe' : '#3730a3' }]}>Chapter Overview</Text>
          </View>
          <Text style={[styles.overviewText, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>{revisionNotes.overview}</Text>
        </View>
      )}

      {/* ── IMPORTANT CONCEPTS ── */}
      {(revisionNotes.concepts ?? []).length > 0 && (
        <View>
          <SectionHeader icon="bulb-outline" color="#f59e0b" title="Important Concepts" isDark={isDark} />
          <View style={{ gap: 12 }}>
            {(revisionNotes.concepts ?? []).map((c, i) => (
              <View key={i} style={[styles.conceptCard, { backgroundColor: C.bg, borderColor: C.border }]}>
                <View style={styles.conceptAccent} />
                <View style={{ flex: 1, paddingLeft: 14 }}>
                  <Text style={[styles.conceptTitle, { color: C.text }]}>{c.title}</Text>
                  <Text style={[styles.conceptExplanation, { color: C.subtext }]}>{c.explanation}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── DEFINITIONS ── */}
      {(revisionNotes.definitions ?? []).length > 0 && (
        <View>
          <SectionHeader icon="book" color="#3b82f6" title="Definitions" isDark={isDark} />
          <View style={{ gap: 10 }}>
            {(revisionNotes.definitions ?? []).map((def, i) => (
              <View key={i} style={[styles.defCard, { backgroundColor: C.bg, borderColor: C.border }]}>
                <View style={styles.defAccent} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={[styles.defTerm, { color: C.text }]}>{def.term}</Text>
                  <Text style={[styles.defDefinition, { color: C.subtext }]}>{def.definition}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── FORMULA SHEET ── */}
      {(revisionNotes.formulas ?? []).length > 0 && (
        <View>
          <SectionHeader icon="calculator" color="#8b5cf6" title="Formula Sheet" isDark={isDark} />
          <View style={{ gap: 12 }}>
            {(revisionNotes.formulas ?? []).map((form, i) => (
              <View key={i} style={[styles.formulaCard, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff', borderColor: isDark ? '#4338ca' : '#c7d2fe' }]}>
                <Text style={[styles.formulaName, { color: isDark ? '#a5b4fc' : '#3730a3' }]}>{form.name}</Text>
                <View style={[styles.formulaBox, { backgroundColor: isDark ? '#0f0f23' : '#ffffff', borderColor: isDark ? '#4338ca' : '#c7d2fe' }]}>
                  <Text style={[styles.formulaText, { color: isDark ? '#c7d2fe' : '#3730a3' }]}>{form.formula}</Text>
                </View>
                {!!form.description && (
                  <Text style={[styles.formulaDesc, { color: isDark ? '#a5b4fc' : '#4338ca' }]}>{form.description}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── IMPORTANT TABLES ── */}
      {(revisionNotes.tables ?? []).length > 0 && (
        <View>
          <SectionHeader icon="grid-outline" color="#06b6d4" title="Important Tables" isDark={isDark} />
          <View style={{ gap: 16 }}>
            {(revisionNotes.tables ?? []).map((table, ti) => (
              <View key={ti} style={[styles.tableContainer, { borderColor: C.border }]}>
                {!!table.title && (
                  <Text style={[styles.tableTitle, { color: C.text, backgroundColor: isDark ? '#292524' : '#f5f5f4', borderBottomColor: C.border }]}>{table.title}</Text>
                )}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    {/* Header row */}
                    <View style={[styles.tableRow, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderBottomColor: isDark ? '#1e40af' : '#bfdbfe', borderBottomWidth: 2 }]}>
                      {table.headers.map((h, hi) => (
                        <Text key={hi} style={[styles.tableHeaderCell, { color: isDark ? '#bfdbfe' : '#1e40af', borderRightColor: isDark ? '#1e40af' : '#bfdbfe' }]}>{h}</Text>
                      ))}
                    </View>
                    {/* Data rows */}
                    {table.rows.map((row, ri) => {
                      // Support both new { cells: string[] } object format and legacy string[] format
                      const cells = Array.isArray(row) ? row : (row as any).cells;
                      if (!cells) return null;
                      
                      return (
                        <View key={ri} style={[styles.tableRow, { backgroundColor: ri % 2 === 0 ? C.bg : C.surface, borderBottomColor: C.border, borderBottomWidth: 1 }]}>
                          {cells.map((cell: string, ci: number) => (
                            <Text key={ci} style={[styles.tableCell, { color: C.text, borderRightColor: C.border }]}>{cell}</Text>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── IMPORTANT PROPERTIES ── */}
      {(revisionNotes.properties ?? []).length > 0 && (
        <View>
          <SectionHeader icon="list-outline" color="#10b981" title="Important Properties" isDark={isDark} />
          <View style={[styles.bulletCard, { backgroundColor: C.bg, borderColor: C.border }]}>
            {(revisionNotes.properties ?? []).map((p, i) => (
              <BulletRow key={i} text={p} color="#10b981" textColor={C.text} />
            ))}
          </View>
        </View>
      )}

      {/* ── IMPORTANT LISTS ── */}
      {(revisionNotes.importantLists ?? []).length > 0 && (
        <View>
          <SectionHeader icon="apps-outline" color="#f97316" title="Important Lists" isDark={isDark} />
          <View style={{ gap: 14 }}>
            {(revisionNotes.importantLists ?? []).map((list, li) => (
              <View key={li} style={[styles.bulletCard, { backgroundColor: C.bg, borderColor: C.border }]}>
                <Text style={[styles.listTitle, { color: C.text }]}>{list.title}</Text>
                {list.items.map((item, ii) => (
                  <BulletRow key={ii} text={item} color="#f97316" textColor={C.subtext} />
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── IMPORTANT POINTS TO REMEMBER ── */}
      {(revisionNotes.importantPoints ?? []).length > 0 && (
        <View>
          <SectionHeader icon="star-outline" color="#eab308" title="Important Points to Remember" isDark={isDark} />
          <View style={[styles.bulletCard, { backgroundColor: isDark ? '#1c1400' : '#fefce8', borderColor: isDark ? '#854d0e' : '#fde68a' }]}>
            {(revisionNotes.importantPoints ?? []).map((p, i) => (
              <BulletRow key={i} text={p} color="#eab308" textColor={isDark ? '#fde68a' : '#713f12'} />
            ))}
          </View>
        </View>
      )}

      {/* ── COMMON MISTAKES ── */}
      {(revisionNotes.commonMistakes ?? []).length > 0 && (
        <View>
          <SectionHeader icon="alert-circle-outline" color="#ef4444" title="Common Mistakes" isDark={isDark} />
          <View style={[styles.bulletCard, { backgroundColor: isDark ? '#2d0a0a' : '#fff5f5', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}>
            {(revisionNotes.commonMistakes ?? []).map((m, i) => (
              <BulletRow key={i} text={m} color="#ef4444" textColor={isDark ? '#fca5a5' : '#991b1b'} />
            ))}
          </View>
        </View>
      )}

      {/* ── FREQUENTLY ASKED EXAM POINTS ── */}
      {(revisionNotes.examPoints ?? []).length > 0 && (
        <View>
          <SectionHeader icon="school-outline" color="#8b5cf6" title="Frequently Asked Exam Points" isDark={isDark} />
          <View style={[styles.bulletCard, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff', borderColor: isDark ? '#4338ca' : '#c7d2fe' }]}>
            {(revisionNotes.examPoints ?? []).map((p, i) => (
              <BulletRow key={i} text={p} color="#8b5cf6" textColor={isDark ? '#c7d2fe' : '#3730a3'} />
            ))}
          </View>
        </View>
      )}

      {/* ── ONE-DAY REVISION NOTES ── */}
      {(revisionNotes.oneDayNotes ?? []).length > 0 && (
        <View>
          <SectionHeader icon="flash-outline" color="#06b6d4" title="One-Day Revision Notes" isDark={isDark} />
          <View style={[styles.bulletCard, { backgroundColor: isDark ? '#0c2430' : '#ecfeff', borderColor: isDark ? '#0e7490' : '#a5f3fc' }]}>
            {(revisionNotes.oneDayNotes ?? []).map((n, i) => (
              <View key={i} style={styles.oneDayRow}>
                <Text style={[styles.oneDayNum, { color: '#06b6d4' }]}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={[styles.oneDayText, { color: isDark ? '#a5f3fc' : '#0c4a6e' }]}>{n}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── MEMORY TRICKS ── */}
      {(revisionNotes.memoryTricks ?? []).length > 0 && (
        <View>
          <SectionHeader icon="sparkles" color="#a855f7" title="Memory Tricks" isDark={isDark} />
          <View style={{ gap: 10 }}>
            {(revisionNotes.memoryTricks ?? []).map((trick, i) => (
              <View key={i} style={[styles.trickCard, { backgroundColor: isDark ? '#2e1065' : '#faf5ff', borderColor: isDark ? '#7e22ce' : '#e9d5ff' }]}>
                <Text style={{ fontSize: 20 }}>🧠</Text>
                <Text style={[styles.trickText, { color: isDark ? '#e9d5ff' : '#581c87' }]}>{trick}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  iconBubble: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  // Overview
  overviewCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  overviewText: { fontSize: 15, lineHeight: 24, fontWeight: '500' },

  // Concepts
  conceptCard: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 16, borderWidth: 1, overflow: 'hidden', paddingVertical: 14, paddingRight: 14 },
  conceptAccent: { width: 4, borderRadius: 2, backgroundColor: '#f59e0b', marginRight: 0 },
  conceptTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  conceptExplanation: { fontSize: 14, lineHeight: 22 },

  // Definitions
  defCard: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 16, borderWidth: 1, overflow: 'hidden', paddingVertical: 14, paddingRight: 14 },
  defAccent: { width: 4, borderRadius: 2, backgroundColor: '#3b82f6', marginRight: 0 },
  defTerm: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  defDefinition: { fontSize: 14, lineHeight: 22 },

  // Formulas
  formulaCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  formulaName: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
  formulaBox: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', marginBottom: 10 },
  formulaText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 1 },
  formulaDesc: { fontSize: 13, lineHeight: 20 },

  // Tables
  tableContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableTitle: { fontSize: 14, fontWeight: '800', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  tableRow: { flexDirection: 'row' },
  tableHeaderCell: { minWidth: 110, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '800', borderRightWidth: 1 },
  tableCell: { minWidth: 110, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, fontWeight: '500', borderRightWidth: 1 },

  // Bullets
  bulletCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: '500' },

  // Important Lists
  listTitle: { fontSize: 15, fontWeight: '900', marginBottom: 8 },

  // One-Day Notes
  oneDayRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  oneDayNum: { fontSize: 13, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2, width: 24 },
  oneDayText: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: '600' },

  // Memory Tricks
  trickCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 16, borderWidth: 1, padding: 14 },
  trickText: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: '600' },
});
