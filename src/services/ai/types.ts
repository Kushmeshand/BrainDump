export interface AIModelInput {
  title?: string;
  description?: string;
  tags?: string[];
  collection?: string;
  extractedText?: string;
  userPrompt?: string;
  /** Questions already shown to the user — used when regenerating a quiz to avoid repetition. */
  previousQuestions?: string[];
}



export interface QuizAttempt {
  score: number;
  total: number;
  date: number;
  timeSpentMs: number;
}

export interface AIQuizResult {
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
  aiGeneratedAt: number;
  /** Set by the AI when the document is too small to generate fully unique questions. */
  regenerationWarning?: string;
}



export interface AIVivaResult {
  questions: {
    question: string;
    answer: string;
  }[];
  aiGeneratedAt: number;
}

export interface AIExplanationResult {
  explanation: string;
  aiGeneratedAt: number;
}

export interface AIRevisionNotesResult {
  overview?: string;
  concepts: { title: string; explanation: string }[];
  definitions: { term: string; definition: string }[];
  formulas: { name: string; formula: string; description?: string }[];
  /** Tables extracted from the uploaded material */
  tables: { title: string; headers: string[]; rows: { cells: string[] }[] }[];
  properties: string[];
  /** Structured lists from the uploaded material */
  importantLists: { title: string; items: string[] }[];
  importantPoints: string[];
  commonMistakes: string[];
  examPoints: string[];
  oneDayNotes: string[];
  memoryTricks: string[];
  aiGeneratedAt: number;
}

export interface AIProvider {
  generateContent(input: AIModelInput, systemPrompt?: string): Promise<string>;
  suggestTags(input: AIModelInput): Promise<string[]>;
  generateSummary(text: string): Promise<string>;
  generateQuiz(input: AIModelInput): Promise<AIQuizResult>;
  generateViva(input: AIModelInput): Promise<AIVivaResult>;
  generateExplanation(input: AIModelInput): Promise<AIExplanationResult>;
  generateRevisionNotes(input: AIModelInput): Promise<AIRevisionNotesResult>;
  extractTextFromImage(imageUrl: string): Promise<string>;
}
