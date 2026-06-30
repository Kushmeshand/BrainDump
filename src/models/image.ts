import { AIQuizResult, AIVivaResult, AIExplanationResult, AIRevisionNotesResult, QuizAttempt } from '../services/ai/types';

export interface ImageItem {
  id: string;
  type: 'image';
  title: string;
  description: string;
  imageUrl: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
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
}
