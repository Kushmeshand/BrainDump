import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useColorScheme, ScrollView, Platform, UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIQuizResult } from '../../services/ai/types';
import { aiService } from '../../services/ai/aiService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface QuizCardProps {
  quiz: AIQuizResult;
  type: 'note' | 'link' | 'image' | 'pdf';
  id: string;
  onGenerateNew: () => void;
}

export default function QuizCard({ quiz, type, id, onGenerateNew }: QuizCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [quizState, setQuizState] = useState<'start' | 'active' | 'results'>('start');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [shuffledQuestions, setShuffledQuestions] = useState(quiz.questions);
  // Track the generation timestamp to only reset when a genuinely NEW quiz is generated.
  // This prevents the Zustand store update (from saveQuizAttempt) from re-triggering this
  // effect and wiping the results screen immediately after submission.
  const lastGeneratedAt = quiz.aiGeneratedAt;

  useEffect(() => {
    // Only reset state when a brand-new quiz is generated, not on shallow re-renders.
    setShuffledQuestions(quiz.questions);
    setQuizState('start');
    setQuizIndex(0);
    setQuizAnswers({});
  }, [lastGeneratedAt]);

  const shuffleArray = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startQuiz = (shuffleQ: boolean, shuffleO: boolean) => {
    let qs = [...quiz.questions];
    if (shuffleQ) qs = shuffleArray(qs);
    if (shuffleO) qs = qs.map(q => ({ ...q, options: shuffleArray(q.options) }));
    setShuffledQuestions(qs);
    setQuizState('active');
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizStartTime(Date.now());
  };

  const submitQuiz = async () => {
    setQuizState('results');
    const correct = shuffledQuestions.filter((q, i) => quizAnswers[i] === q.correctAnswer).length;
    const timeSpentMs = Date.now() - quizStartTime;
    try {
      await aiService.saveQuizAttempt(type, id, { score: correct, total: shuffledQuestions.length, date: Date.now(), timeSpentMs });
    } catch (e) { console.error('Failed to save quiz attempt', e); }
  };

  const C = {
    bg: isDark ? '#1c1917' : '#ffffff',
    surface: isDark ? '#292524' : '#f5f5f4',
    border: isDark ? '#44403c' : '#e7e5e4',
    text: isDark ? '#ffffff' : '#1c1917',
    subtext: isDark ? '#a8a29e' : '#78716c',
    selectedBg: isDark ? '#3b1d8a' : '#ede9fe',
    selectedBorder: '#8b5cf6',
    selectedText: isDark ? '#ffffff' : '#4c1d95',
  };

  // START SCREEN
  if (quizState === 'start') {
    return (
      <View style={styles.startContainer}>
        <View style={[styles.schoolIcon, { backgroundColor: isDark ? '#292524' : '#fef3c7', borderColor: isDark ? '#44403c' : '#fde68a' }]}>
          <Ionicons name="school" size={44} color="#d97706" />
        </View>
        <Text style={[styles.startTitle, { color: C.text }]}>Ready to Test Yourself?</Text>
        <Text style={[styles.startSubtitle, { color: C.subtext }]}>
          {quiz.questions.length} multiple-choice questions based on your study material.
        </Text>
        <TouchableOpacity onPress={() => startQuiz(false, false)} style={styles.startBtn}>
          <Text style={styles.startBtnText}>Start Quiz</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => startQuiz(true, true)}
          style={[styles.shuffleBtn, { backgroundColor: C.surface, borderColor: C.border }]}
        >
          <Ionicons name="shuffle" size={18} color={C.subtext} />
          <Text style={[styles.shuffleBtnText, { color: C.subtext }]}>  Start Shuffled</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ACTIVE QUIZ SCREEN
  if (quizState === 'active') {
    const currentQ = shuffledQuestions[quizIndex];
    const totalQ = shuffledQuestions.length;
    const progress = (quizIndex / totalQ) * 100;
    const answeredCount = Object.keys(quizAnswers).length;
    const isLastQuestion = quizIndex === totalQ - 1;
    const allAnswered = answeredCount === totalQ;

    return (
      <View>
        {/* Progress */}
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: C.subtext }]}>Question {quizIndex + 1} of {totalQ}</Text>
          <Text style={{ color: '#8b5cf6', fontWeight: '800', fontSize: 13 }}>{Math.round(progress)}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: isDark ? '#292524' : '#e7e5e4' }]}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>

        {/* Question */}
        <Text style={[styles.questionText, { color: C.text }]}>{currentQ.question}</Text>

        {/* Options */}
        <View style={{ gap: 10, marginBottom: 24 }}>
          {currentQ.options.map((opt, i) => {
            const isSelected = quizAnswers[quizIndex] === opt;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setQuizAnswers(prev => ({ ...prev, [quizIndex]: opt }))}
                activeOpacity={0.7}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: isSelected ? C.selectedBg : C.bg,
                    borderColor: isSelected ? C.selectedBorder : C.border,
                  }
                ]}
              >
                <View style={[styles.optionRadio, {
                  borderColor: isSelected ? '#8b5cf6' : C.subtext,
                  backgroundColor: isSelected ? '#8b5cf6' : 'transparent',
                }]}>
                  {isSelected && <View style={styles.optionRadioInner} />}
                </View>
                <Text style={[styles.optionText, { color: isSelected ? C.selectedText : C.text }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Navigation */}
        <View style={[styles.navRow, { borderTopColor: C.border }]}>
          <TouchableOpacity
            onPress={() => setQuizIndex(q => q - 1)}
            disabled={quizIndex === 0}
            style={[styles.navBtnPrev, {
              backgroundColor: quizIndex === 0 ? 'transparent' : (isDark ? '#292524' : '#f5f5f4'),
              borderColor: C.border,
              opacity: quizIndex === 0 ? 0.35 : 1,
            }]}
          >
            <Ionicons name="arrow-back" size={18} color={C.subtext} />
            <Text style={[styles.navBtnText, { color: C.subtext }]}>  Previous</Text>
          </TouchableOpacity>

          {!isLastQuestion ? (
            <TouchableOpacity
              onPress={() => setQuizIndex(q => q + 1)}
              style={[styles.navBtnNext, { backgroundColor: isDark ? '#ffffff' : '#1c1917' }]}
            >
              <Text style={[styles.navBtnText, { color: isDark ? '#1c1917' : '#ffffff' }]}>Next  </Text>
              <Ionicons name="arrow-forward" size={18} color={isDark ? '#1c1917' : '#ffffff'} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={submitQuiz}
              style={[styles.submitBtn, { opacity: allAnswered ? 1 : 0.45 }]}
            >
              <Text style={styles.submitBtnText}>Submit Quiz</Text>
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {!allAnswered && isLastQuestion && (
          <Text style={[styles.unansweredNote, { color: '#f59e0b' }]}>
            ⚠️  Answer all questions to submit ({answeredCount}/{totalQ} answered)
          </Text>
        )}
      </View>
    );
  }

  // RESULTS SCREEN
  const correctCount = shuffledQuestions.filter((q, i) => quizAnswers[i] === q.correctAnswer).length;
  const scorePercent = Math.round((correctCount / shuffledQuestions.length) * 100);

  return (
    <View>
      {/* Score Card */}
      <View style={[styles.scoreCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.scoreLabel, { color: C.subtext }]}>QUIZ COMPLETED</Text>
        <View style={styles.scoreNumbers}>
          <Text style={[styles.scoreBig, { color: C.text }]}>{correctCount}</Text>
          <Text style={[styles.scoreTotal, { color: C.subtext }]}> / {shuffledQuestions.length}</Text>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: C.bg, borderColor: C.border }]}>
            <Text style={[styles.statVal, { color: '#8b5cf6' }]}>{scorePercent}%</Text>
            <Text style={[styles.statLabel, { color: C.subtext }]}>Score</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: C.bg, borderColor: C.border }]}>
            <Text style={[styles.statVal, { color: '#10b981' }]}>{correctCount}</Text>
            <Text style={[styles.statLabel, { color: C.subtext }]}>Correct</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: C.bg, borderColor: C.border }]}>
            <Text style={[styles.statVal, { color: '#ef4444' }]}>{shuffledQuestions.length - correctCount}</Text>
            <Text style={[styles.statLabel, { color: C.subtext }]}>Wrong</Text>
          </View>
        </View>
      </View>

      {/* Review */}
      <Text style={[styles.reviewTitle, { color: C.text }]}>Review Answers</Text>
      {shuffledQuestions.map((q, i) => {
        const isCorrect = quizAnswers[i] === q.correctAnswer;
        return (
          <View key={i} style={[styles.reviewCard, { backgroundColor: C.bg, borderColor: C.border }]}>
            <Text style={[styles.reviewQ, { color: C.text }]}>{i + 1}. {q.question}</Text>
            <View style={[styles.answerRow, {
              backgroundColor: isCorrect ? (isDark ? '#052e16' : '#f0fdf4') : (isDark ? '#2d0a0a' : '#fff5f5'),
              borderColor: isCorrect ? '#10b981' : '#ef4444'
            }]}>
              <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={20} color={isCorrect ? '#10b981' : '#ef4444'} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.answerLabel, { color: C.subtext }]}>Your Answer</Text>
                <Text style={[styles.answerText, { color: isCorrect ? '#10b981' : '#ef4444' }]}>{quizAnswers[i] || 'Not answered'}</Text>
              </View>
            </View>
            {!isCorrect && (
              <View style={[styles.answerRow, { backgroundColor: isDark ? '#1c1917' : '#f5f5f4', borderColor: C.border }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[styles.answerLabel, { color: C.subtext }]}>Correct Answer</Text>
                  <Text style={[styles.answerText, { color: '#10b981' }]}>{q.correctAnswer}</Text>
                </View>
              </View>
            )}
            <View style={[styles.explanationBox, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: isDark ? '#1e40af' : '#bfdbfe' }]}>
              <Text style={[styles.explanationLabel, { color: '#3b82f6' }]}>💡 Explanation</Text>
              <Text style={[styles.explanationText, { color: isDark ? '#bfdbfe' : '#1e3a5f' }]}>{q.explanation}</Text>
            </View>
          </View>
        );
      })}

      {/* Bottom Buttons */}
      <TouchableOpacity
        onPress={() => startQuiz(false, false)}
        style={[styles.retryBtn, { backgroundColor: isDark ? '#ffffff' : '#1c1917', borderColor: isDark ? '#ffffff' : '#1c1917' }]}
      >
        <Ionicons name="refresh" size={18} color={isDark ? '#1c1917' : '#ffffff'} />
        <Text style={[styles.retryBtnText, { color: isDark ? '#1c1917' : '#ffffff' }]}>  Retry Quiz</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onGenerateNew}
        style={[styles.newQuizBtn, { backgroundColor: C.bg, borderColor: '#f59e0b' }]}
      >
        <Ionicons name="sparkles" size={18} color="#f59e0b" />
        <Text style={[styles.newQuizBtnText, { color: '#f59e0b' }]}>  Generate New Quiz</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // START
  startContainer: { alignItems: 'center', paddingVertical: 24 },
  schoolIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 20 },
  startTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  startSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 12 },
  startBtn: { backgroundColor: '#f59e0b', width: '100%', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  startBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 16 },
  shuffleBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  shuffleBtnText: { fontWeight: '700', fontSize: 15 },
  // ACTIVE
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  progressBar: { height: 8, borderRadius: 4, marginBottom: 24, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 4 },
  questionText: { fontSize: 20, fontWeight: '900', lineHeight: 30, marginBottom: 20 },
  optionBtn: { paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16, borderWidth: 2, flexDirection: 'row', alignItems: 'center' },
  optionRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, gap: 12 },
  navBtnPrev: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  navBtnNext: { flex: 1, paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontWeight: '700', fontSize: 15 },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#8b5cf6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  unansweredNote: { textAlign: 'center', fontSize: 13, fontWeight: '600', marginTop: 10 },
  // RESULTS
  scoreCard: { borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 24 },
  scoreLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  scoreNumbers: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  scoreBig: { fontSize: 72, fontWeight: '900', letterSpacing: -3 },
  scoreTotal: { fontSize: 28, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1 },
  statVal: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  reviewTitle: { fontSize: 20, fontWeight: '900', marginBottom: 16 },
  reviewCard: { marginBottom: 16, borderRadius: 20, borderWidth: 1, padding: 18 },
  reviewQ: { fontSize: 16, fontWeight: '800', marginBottom: 14, lineHeight: 24 },
  answerRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 8 },
  answerLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  answerText: { fontSize: 15, fontWeight: '700' },
  explanationBox: { padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  explanationLabel: { fontSize: 11, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  explanationText: { fontSize: 14, lineHeight: 22 },
  retryBtn: { paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginTop: 8, marginBottom: 10 },
  retryBtnText: { fontWeight: '900', fontSize: 15 },
  newQuizBtn: { paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 8 },
  newQuizBtnText: { fontWeight: '900', fontSize: 15 },
});
