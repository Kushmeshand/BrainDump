import { AIQuizResult, AIVivaResult, AIExplanationResult, AIRevisionNotesResult, QuizAttempt } from '../services/ai/types';

export interface Note {
  id: string;
  title: string;
  content: string;
  collectionId: string | null;
  tags: string[];
  favorite: boolean;
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
}
