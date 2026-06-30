import { AIQuizResult, AIVivaResult, AIExplanationResult, AIRevisionNotesResult, QuizAttempt } from '../services/ai/types';

export interface PdfItem {
  id: string;
  type: 'pdf';
  title: string;
  description: string;
  pdfUrl: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  pageCount?: number;
  collectionId: string | null;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;

  // Cached AI Summary fields
  aiReadingTime?: string;
  aiRevisionTopics?: string[];
  aiGeneratedAt?: number;
  aiQuiz?: AIQuizResult;
  aiQuizAttempts?: QuizAttempt[];
  aiViva?: AIVivaResult;
  aiExplain?: AIExplanationResult;
  aiRevisionNotes?: AIRevisionNotesResult;

  extractedText?: string;
}
