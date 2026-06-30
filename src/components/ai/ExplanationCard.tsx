import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useColorScheme, Platform, Alert, Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

interface ExplanationCardProps {
  explanation: string;
}

export default function ExplanationCard({ explanation }: ExplanationCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleCopy = () => {
    Clipboard.setString(explanation);
    Alert.alert('Copied', 'Explanation copied to clipboard');
  };

  const T = isDark ? '#ffffff' : '#1c1917';
  const Sub = isDark ? '#a8a29e' : '#78716c';
  const CodeBg = isDark ? '#0a0a0a' : '#18181b';
  const QuoteBg = isDark ? '#1e1b4b' : '#eef2ff';
  const QuoteBorder = isDark ? '#6366f1' : '#4f46e5';

  const markdownStyles = StyleSheet.create({
    body: { color: T, fontSize: 16, lineHeight: 27 },
    heading1: { color: T, fontSize: 26, fontWeight: '900', marginTop: 24, marginBottom: 12 },
    heading2: { color: T, fontSize: 22, fontWeight: '800', marginTop: 20, marginBottom: 10 },
    heading3: { color: isDark ? '#c4b5fd' : '#6d28d9', fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    code_block: {
      backgroundColor: CodeBg, color: '#7dd3fc',
      padding: 16, borderRadius: 14, marginVertical: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14, lineHeight: 22,
    },
    fence: {
      backgroundColor: CodeBg, color: '#7dd3fc',
      padding: 16, borderRadius: 14, marginVertical: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14, lineHeight: 22,
    },
    code_inline: {
      backgroundColor: isDark ? '#292524' : '#f4f4f5',
      color: isDark ? '#c4b5fd' : '#7c3aed',
      paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: 6,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14,
    },
    blockquote: {
      backgroundColor: QuoteBg, borderLeftColor: QuoteBorder, borderLeftWidth: 4,
      paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, marginVertical: 12,
    },
    bullet_list: { marginVertical: 8 },
    ordered_list: { marginVertical: 8 },
    list_item: { marginBottom: 6 },
    strong: { color: T, fontWeight: '900' },
    em: { color: Sub, fontStyle: 'italic' },
    table: { borderWidth: 1, borderColor: isDark ? '#44403c' : '#e7e5e4', borderRadius: 10, marginVertical: 12 },
    tr: { borderBottomWidth: 1, borderColor: isDark ? '#44403c' : '#e7e5e4' },
    th: { padding: 10, backgroundColor: isDark ? '#292524' : '#f5f5f4', fontWeight: '800', color: T },
    td: { padding: 10, color: T },
    hr: { borderColor: isDark ? '#44403c' : '#e7e5e4', marginVertical: 16 },
  });

  return (
    <View>
      <TouchableOpacity
        onPress={handleCopy}
        style={[styles.copyBtn, { backgroundColor: isDark ? '#292524' : '#f5f5f4', borderColor: isDark ? '#44403c' : '#e7e5e4' }]}
      >
        <Ionicons name="copy-outline" size={16} color={isDark ? '#d6d3d1' : '#57534e'} />
        <Text style={[styles.copyBtnText, { color: isDark ? '#d6d3d1' : '#57534e' }]}>  Copy</Text>
      </TouchableOpacity>

      <Markdown style={markdownStyles}>
        {explanation}
      </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 16,
  },
  copyBtnText: { fontSize: 13, fontWeight: '700' },
});
