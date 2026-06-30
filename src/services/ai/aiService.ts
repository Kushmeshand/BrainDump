import { AIModelInput, AIProvider } from './types';
import { GroqProvider } from './groq';
import { buildContextPrompt } from './prompts';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useNotesStore } from '../../store/notesStore';
import { useLinksStore } from '../../store/linksStore';
import { useImagesStore } from '../../store/imagesStore';
import { usePdfsStore } from '../../store/pdfsStore';
import { sanitizeFirestoreData, validateFirestoreData } from '../../utils/firestoreSanitizer';

class AIService {
  private activeProvider: AIProvider;

  constructor() {
    // Default to Groq, can be customized based on env or settings later
    this.activeProvider = new GroqProvider();
  }

  /**
   * Set a different AI provider dynamically (e.g., if switching to OpenAI or Claude)
   */
  setProvider(provider: AIProvider) {
    this.activeProvider = provider;
  }

  /**
   * General content generation based on material context and user query
   */
  async generateContent(input: AIModelInput, systemPrompt?: string): Promise<string> {
    return this.activeProvider.generateContent(input, systemPrompt);
  }

  /**
   * Suggests tags based on item metadata and content
   */
  async suggestTags(input: AIModelInput): Promise<string[]> {
    return this.activeProvider.suggestTags(input);
  }

  /**
   * Generates a concise summary for a given text
   */
  async generateSummary(text: string): Promise<string> {
    return this.activeProvider.generateSummary(text);
  }

  private async updateStoreAndFirestore(
    type: 'note' | 'link' | 'image' | 'pdf',
    id: string,
    data: any
  ) {
    const docCollection = type === 'note' ? 'notes' : type === 'link' ? 'links' : type === 'image' ? 'images' : 'pdfs';
    const docRef = doc(db, docCollection, id);

    // 1. Sanitize the data (remove undefined, flatten nested arrays)
    const safeData = sanitizeFirestoreData(data);
    
    // 2. Validate before sending to Firestore
    validateFirestoreData(safeData);

    await updateDoc(docRef, safeData);

    if (type === 'note') {
      const store = useNotesStore.getState();
      store.setNotes(store.notes.map((n) => (n.id === id ? { ...n, ...data } : n)));
    } else if (type === 'link') {
      const store = useLinksStore.getState();
      store.setLinks(store.links.map((l) => (l.id === id ? { ...l, ...data } : l)));
    } else if (type === 'image') {
      const store = useImagesStore.getState();
      store.setImages(store.images.map((img) => (img.id === id ? { ...img, ...data } : img)));
    } else if (type === 'pdf') {
      const store = usePdfsStore.getState();
      store.setPdfs(store.pdfs.map((p) => (p.id === id ? { ...p, ...data } : p)));
    }
  }

  /**
   * Splits a large text into logical chunks of roughly MAX_CHUNK_LENGTH characters.
   */
  private chunkText(text: string, maxChunkLength: number = 20000): string[] {
    if (!text || text.length <= maxChunkLength) return [text];
    
    const chunks: string[] = [];
    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      let chunkEnd = currentIndex + maxChunkLength;
      
      if (chunkEnd < text.length) {
        let breakIndex = text.lastIndexOf('\n\n', chunkEnd);
        if (breakIndex <= currentIndex) breakIndex = text.lastIndexOf('\n', chunkEnd);
        if (breakIndex <= currentIndex) breakIndex = text.lastIndexOf('. ', chunkEnd);
        
        if (breakIndex <= currentIndex) {
          breakIndex = chunkEnd;
        } else {
          breakIndex += 1;
        }
        
        chunks.push(text.slice(currentIndex, breakIndex).trim());
        currentIndex = breakIndex;
      } else {
        chunks.push(text.slice(currentIndex).trim());
        currentIndex = text.length;
      }
    }
    
    return chunks.filter(c => c.length > 0);
  }

  /**
   * Logs AI input diagnostics so it's easy to trace text loss in the pipeline.
   */
  private logAiInput(feature: string, input: AIModelInput, chunks: string[]) {
    const total = (input.extractedText || '').length;
    console.log(`\n[AI:${feature}] ─────────────────────────────`);
    console.log(`[AI:${feature}]   extractedText length : ${total} chars`);
    console.log(`[AI:${feature}]   Chunk count          : ${chunks.length}`);
    chunks.forEach((c, i) => console.log(`[AI:${feature}]   Chunk ${i + 1}            : ${c.length} chars`));
    if (total === 0) console.warn(`[AI:${feature}] ⚠ extractedText is EMPTY — AI will see no document content!`);
  }

  async generateAndCacheQuiz(
    type: 'note' | 'link' | 'image' | 'pdf',
    id: string,
    input: AIModelInput,
    previousQuestions?: string[]
  ) {
    let allQuestions: any[] = [];
    let regenerationWarning: string | undefined;
    
    const textToProcess = input.extractedText || '';
    const chunks = this.chunkText(textToProcess);
    this.logAiInput('Quiz', input, chunks);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkInput = { ...input, extractedText: chunks[i] };
      const enrichedInput: AIModelInput = previousQuestions && previousQuestions.length > 0
        ? { ...chunkInput, previousQuestions }
        : chunkInput;
        
      try {
        const result = await this.activeProvider.generateQuiz(enrichedInput);
        if (result.questions) allQuestions = [...allQuestions, ...result.questions];
        if (result.regenerationWarning) regenerationWarning = result.regenerationWarning;
      } catch (err) {
        console.warn(`[AI] Failed to generate quiz for chunk ${i+1}/${chunks.length}`, err);
        if (chunks.length === 1) throw err;
      }
    }
    
    if (allQuestions.length === 0) {
      throw new Error('Unable to generate quiz from any part of the document. Please try again.');
    }

    const finalResult = {
      questions: allQuestions,
      aiGeneratedAt: Date.now(),
      regenerationWarning
    };

    await this.updateStoreAndFirestore(type, id, { aiQuiz: finalResult });
    return finalResult;
  }

  async generateAndCacheViva(
    type: 'note' | 'link' | 'image' | 'pdf',
    id: string,
    input: AIModelInput
  ) {
    let allQuestions: any[] = [];
    const textToProcess = input.extractedText || '';
    const chunks = this.chunkText(textToProcess);
    this.logAiInput('Viva', input, chunks);

    for (let i = 0; i < chunks.length; i++) {
      const chunkInput = { ...input, extractedText: chunks[i] };
      try {
        const result = await this.activeProvider.generateViva(chunkInput);
        if (result.questions) allQuestions = [...allQuestions, ...result.questions];
      } catch (err) {
        console.warn(`[AI] Failed to generate viva for chunk ${i+1}`, err);
        if (chunks.length === 1) throw err;
      }
    }

    if (allQuestions.length === 0) throw new Error('Unable to generate viva questions.');

    const finalResult = { questions: allQuestions, aiGeneratedAt: Date.now() };
    await this.updateStoreAndFirestore(type, id, { aiViva: finalResult });
    return finalResult;
  }

  async generateAndCacheExplanation(
    type: 'note' | 'link' | 'image' | 'pdf',
    id: string,
    input: AIModelInput
  ) {
    let fullExplanation = '';
    const textToProcess = input.extractedText || '';
    const chunks = this.chunkText(textToProcess);
    this.logAiInput('Explain', input, chunks);

    for (let i = 0; i < chunks.length; i++) {
      const chunkInput = { ...input, extractedText: chunks[i] };
      try {
        const result = await this.activeProvider.generateExplanation(chunkInput);
        if (result.explanation) {
          fullExplanation += (i > 0 ? '\n\n---\n\n' : '') + result.explanation;
        }
      } catch (err) {
        console.warn(`[AI] Failed to generate explanation for chunk ${i+1}`, err);
        if (chunks.length === 1) throw err;
      }
    }

    if (!fullExplanation) throw new Error('Unable to generate explanation.');

    const finalResult = { explanation: fullExplanation, aiGeneratedAt: Date.now() };
    await this.updateStoreAndFirestore(type, id, { aiExplain: finalResult });
    return finalResult;
  }

  async generateAndCacheRevisionNotes(
    type: 'note' | 'link' | 'image' | 'pdf',
    id: string,
    input: AIModelInput
  ) {
    const finalResult: any = {
      overview: '', concepts: [], definitions: [], formulas: [], tables: [],
      properties: [], importantLists: [], importantPoints: [], commonMistakes: [],
      examPoints: [], oneDayNotes: [], memoryTricks: [], aiGeneratedAt: Date.now()
    };

    const textToProcess = input.extractedText || '';
    const chunks = this.chunkText(textToProcess);
    this.logAiInput('Revision', input, chunks);

    for (let i = 0; i < chunks.length; i++) {
      const chunkInput = { ...input, extractedText: chunks[i] };
      try {
        const result = await this.activeProvider.generateRevisionNotes(chunkInput);
        
        if (result.overview) finalResult.overview += (finalResult.overview ? ' ' : '') + result.overview;
        
        finalResult.concepts = [...finalResult.concepts, ...(result.concepts || [])];
        finalResult.definitions = [...finalResult.definitions, ...(result.definitions || [])];
        finalResult.formulas = [...finalResult.formulas, ...(result.formulas || [])];
        finalResult.tables = [...finalResult.tables, ...(result.tables || [])];
        finalResult.properties = [...finalResult.properties, ...(result.properties || [])];
        finalResult.importantLists = [...finalResult.importantLists, ...(result.importantLists || [])];
        finalResult.importantPoints = [...finalResult.importantPoints, ...(result.importantPoints || [])];
        finalResult.commonMistakes = [...finalResult.commonMistakes, ...(result.commonMistakes || [])];
        finalResult.examPoints = [...finalResult.examPoints, ...(result.examPoints || [])];
        finalResult.oneDayNotes = [...finalResult.oneDayNotes, ...(result.oneDayNotes || [])];
        finalResult.memoryTricks = [...finalResult.memoryTricks, ...(result.memoryTricks || [])];
      } catch (err) {
        console.warn(`[AI] Failed to generate revision notes for chunk ${i+1}`, err);
        if (chunks.length === 1) throw err;
      }
    }

    if (finalResult.concepts.length === 0 && finalResult.definitions.length === 0) {
      throw new Error('Unable to generate revision notes.');
    }

    await this.updateStoreAndFirestore(type, id, { aiRevisionNotes: finalResult });
    return finalResult;
  }

  async saveQuizAttempt(
    type: 'note' | 'link' | 'image' | 'pdf',
    id: string,
    attempt: { score: number; total: number; date: number; timeSpentMs: number }
  ) {
    const docCollection = type === 'note' ? 'notes' : type === 'link' ? 'links' : type === 'image' ? 'images' : 'pdfs';
    const docRef = doc(db, docCollection, id);
    
    const safeAttempt = sanitizeFirestoreData(attempt);
    validateFirestoreData(safeAttempt);

    // Update Firestore using arrayUnion
    await updateDoc(docRef, {
      aiQuizAttempts: arrayUnion(safeAttempt)
    });

    // Update local Zustand store
    const updateLocal = (storeState: any, setMethod: string, arrayName: string) => {
      const store = (storeState as any).getState();
      const items = store[arrayName];
      store[setMethod](items.map((item: any) => {
        if (item.id === id) {
          const updatedAttempts = item.aiQuizAttempts ? [...item.aiQuizAttempts, attempt] : [attempt];
          return { ...item, aiQuizAttempts: updatedAttempts };
        }
        return item;
      }));
    };

    if (type === 'note') updateLocal(useNotesStore, 'setNotes', 'notes');
    else if (type === 'link') updateLocal(useLinksStore, 'setLinks', 'links');
    else if (type === 'image') updateLocal(useImagesStore, 'setImages', 'images');
    else if (type === 'pdf') updateLocal(usePdfsStore, 'setPdfs', 'pdfs');
  }
}

export const aiService = new AIService();
