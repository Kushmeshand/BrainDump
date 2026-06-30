import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert,
  StyleSheet, useColorScheme, Platform, UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../services/ai/aiService';
import { loadExtractedText } from '../services/pdfs';
import { AIQuizResult, AIVivaResult, AIExplanationResult, AIRevisionNotesResult } from '../services/ai/types';

import ExplanationCard from './ai/ExplanationCard';
import QuizCard from './ai/QuizCard';
import VivaCard from './ai/VivaCard';
import RevisionNotesCard from './ai/RevisionNotesCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIStudyAssistantProps {
  type: 'note' | 'link' | 'image' | 'pdf';
  id: string;
  aiGeneratedAt?: number;
  aiExplain?: AIExplanationResult;
  aiQuiz?: AIQuizResult;
  aiViva?: AIVivaResult;
  aiRevisionNotes?: AIRevisionNotesResult;
  getContextInput: () => {
    title: string;
    description?: string;
    content?: string;
    tags?: string[];
    collectionName?: string;
    extractedText?: string;
    url?: string;
  };
}

type ActiveSection = 'none' | 'explain' | 'quiz' | 'viva' | 'revision';

const ACTION_CARDS = [
  { section: 'explain' as ActiveSection, title: 'Explain', icon: 'school', color: '#10b981' },
  { section: 'quiz' as ActiveSection, title: 'Quiz Me', icon: 'help-circle', color: '#f59e0b' },
  { section: 'viva' as ActiveSection, title: 'Viva Questions', icon: 'mic', color: '#06b6d4' },
  { section: 'revision' as ActiveSection, title: 'Revision Notes', icon: 'book', color: '#6366f1' },
];

export default function AIStudyAssistant({
  type, id,
  aiGeneratedAt,
  aiExplain, aiQuiz, aiViva, aiRevisionNotes,
  getContextInput
}: AIStudyAssistantProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeSection, setActiveSection] = useState<ActiveSection>('none');
  const [loadingStates, setLoadingStates] = useState<Record<ActiveSection, boolean>>({
    none: false, explain: false, quiz: false, viva: false, revision: false
  });

  const C = {
    bg: isDark ? '#1c1917' : '#ffffff',
    card: isDark ? '#292524' : '#f5f5f4',
    border: isDark ? '#44403c' : '#e7e5e4',
    text: isDark ? '#ffffff' : '#1c1917',
    subtext: isDark ? '#a8a29e' : '#78716c',
  };

  const isCachedFor = (section: ActiveSection) => {
    if (section === 'explain') return !!aiExplain;
    if (section === 'quiz') return !!aiQuiz;
    if (section === 'viva') return !!aiViva;
    if (section === 'revision') return !!aiRevisionNotes;
    return false;
  };

  const toggleSection = (section: ActiveSection) => {
    setActiveSection(prev => prev === section ? 'none' : section);
  };

  // Build base context synchronously from the Zustand store.
  // For PDFs, the store only has the 500-char preview — the full text
  // is loaded asynchronously in handleGenerate before invoking the AI.
  const buildBaseContext = () => {
    const ctx = getContextInput();
    if (!ctx.title && !ctx.description && !ctx.content && !ctx.extractedText && !ctx.url) {
      return null;
    }
    return {
      title: ctx.title, description: ctx.description, tags: ctx.tags,
      collection: ctx.collectionName,
      extractedText: ctx.content || ctx.extractedText,
      userPrompt: ctx.url ? `Analyze webpage URL: ${ctx.url}. ${ctx.description || ''}` : undefined
    };
  };

  const handleGenerate = async (section: ActiveSection, forceRegenerate = false) => {
    const baseInput = buildBaseContext();
    if (!baseInput) {
      Alert.alert('Details Required', 'Please add some content before generating AI materials.');
      return;
    }

    setActiveSection(section);
    setLoadingStates(prev => ({ ...prev, [section]: true }));

    try {
      // For PDFs, always load the COMPLETE text from the Firestore sub-document.
      // The Zustand store only holds a 500-char preview to stay under the 1MB limit.
      let fullExtractedText = baseInput.extractedText || '';
      if (type === 'pdf') {
        const fullText = await loadExtractedText(id, fullExtractedText);
        console.log(`[AI_ASSISTANT] Loaded text for AI — ${fullText.length} chars (store had: ${fullExtractedText.length} chars)`);
        fullExtractedText = fullText;
      }

      const input = { ...baseInput, extractedText: fullExtractedText };
      console.log(`[AI_ASSISTANT] Sending ${input.extractedText?.length || 0} chars to AI for section: ${section}`);

      if (section === 'explain') await aiService.generateAndCacheExplanation(type, id, input);
      else if (section === 'quiz') {
        // When regenerating, pass the current quiz questions so the AI avoids repeating them.
        const previousQuestions = forceRegenerate && aiQuiz && aiQuiz.questions.length > 0
          ? aiQuiz.questions.map(q => q.question)
          : undefined;
        const result = await aiService.generateAndCacheQuiz(type, id, input, previousQuestions);
        // Warn the user if the AI flagged that the document is too small for fully unique questions.
        if (result.regenerationWarning) {
          Alert.alert(
            '⚠️ Limited Content',
            'Most concepts from this resource have already been covered. Some questions may be similar.',
            [{ text: 'OK' }]
          );
        }
      }
      else if (section === 'viva') await aiService.generateAndCacheViva(type, id, input);
      else if (section === 'revision') await aiService.generateAndCacheRevisionNotes(type, id, input);
    } catch (err: any) {
      Alert.alert('Generation Failed', err?.message || 'Failed to generate content.');
      setActiveSection('none');
    } finally {
      setLoadingStates(prev => ({ ...prev, [section]: false }));
    }
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: isDark ? '#2e1065' : '#ede9fe' }]}>
          <Ionicons name="sparkles" size={20} color="#8b5cf6" />
        </View>
        <Text style={[styles.headerTitle, { color: C.text }]}>AI Study Assistant</Text>
      </View>

      {/* Grid of action cards */}
      <View style={styles.grid}>
        {ACTION_CARDS.map(({ section, title, icon, color }) => {
          const isLoading = loadingStates[section];
          const isActive = activeSection === section;
          const isCached = isCachedFor(section);
          return (
            <TouchableOpacity
              key={section}
              onPress={() => {
                if (isLoading) return;
                if (isCached || isActive) toggleSection(section);
                else handleGenerate(section);
              }}
              activeOpacity={0.75}
              style={[
                styles.actionCard,
                {
                  backgroundColor: isActive ? (isDark ? '#2d1d5e' : '#ede9fe') : C.card,
                  borderColor: isActive ? '#8b5cf6' : C.border,
                }
              ]}
            >
              <View style={styles.actionCardTop}>
                <View style={[styles.actionIcon, { backgroundColor: color }]}>
                  <Ionicons name={icon as any} size={22} color="#ffffff" />
                </View>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#8b5cf6" />
                ) : isCached && !isActive ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                ) : isActive ? (
                  <Ionicons name="chevron-up" size={22} color="#8b5cf6" />
                ) : null}
              </View>
              <Text style={[styles.actionTitle, { color: isActive ? '#8b5cf6' : C.text }]}>{title}</Text>
              <Text style={[styles.actionSubtitle, { color: C.subtext }]}>
                {isLoading ? 'Generating...' : isCached ? (isActive ? 'Close' : 'Tap to view') : 'Tap to generate'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Panel */}
      {activeSection !== 'none' && !loadingStates[activeSection] && (
        <View style={[styles.contentPanel, { backgroundColor: C.bg, borderColor: C.border }]}>
          {/* Panel Header */}
          <View style={[styles.panelHeader, { borderBottomColor: C.border }]}>
            <Text style={[styles.panelTitle, { color: C.text }]}>
              {ACTION_CARDS.find(a => a.section === activeSection)?.title ?? activeSection}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleGenerate(activeSection, true)}
                style={[styles.regenBtn, { backgroundColor: C.card, borderColor: C.border }]}
              >
                <Ionicons name="refresh" size={15} color={C.subtext} />
                <Text style={[styles.regenBtnText, { color: C.subtext }]}>  Regenerate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveSection('none')}
                style={[styles.closeBtn, { backgroundColor: C.card, borderColor: C.border }]}
              >
                <Ionicons name="close" size={18} color={C.subtext} />
              </TouchableOpacity>
            </View>
          </View>

          {/* EXPLAIN */}
          {activeSection === 'explain' && aiExplain && (
            <ExplanationCard explanation={aiExplain.explanation} />
          )}

          {/* QUIZ */}
          {activeSection === 'quiz' && aiQuiz && (
            <QuizCard quiz={aiQuiz} type={type} id={id} onGenerateNew={() => handleGenerate('quiz', true)} />
          )}

          {/* VIVA */}
          {activeSection === 'viva' && aiViva && (
            <VivaCard vivaResult={aiViva} />
          )}

          {/* REVISION NOTES */}
          {activeSection === 'revision' && aiRevisionNotes && (
            <RevisionNotesCard revisionNotes={aiRevisionNotes} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', marginLeft: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  actionCard: { width: '47%', padding: 16, borderRadius: 20, borderWidth: 1.5 },
  actionCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  actionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 3 },
  actionSubtitle: { fontSize: 11, fontWeight: '600' },
  contentPanel: { borderRadius: 24, borderWidth: 1.5, padding: 20, marginTop: 4 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1 },
  panelTitle: { fontSize: 19, fontWeight: '900' },
  regenBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  regenBtnText: { fontSize: 12, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

});
