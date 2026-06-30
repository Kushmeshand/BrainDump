import Groq from 'groq-sdk';
import { AIModelInput, AIProvider } from './types';
import { buildContextPrompt, buildQuizRegenerationPrompt, SYSTEM_PROMPTS } from './prompts';

// Minimal strict-JSON retry system prompt appended on second attempt
const JSON_RETRY_SUFFIX = `\n\nCRITICAL: Your previous response was not valid JSON. Return ONLY a raw JSON object. Do NOT include any markdown, code fences, comments, introductory text or trailing text. Start your response with { and end with }.`;

export class GroqProvider implements AIProvider {
  private groq: Groq | null = null;
  private modelName = 'llama-3.3-70b-versatile';

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (apiKey) {
      this.groq = new Groq({
        apiKey,
        dangerouslyAllowBrowser: true // Required for React Native/Expo usage
      });
    } else {
      console.warn('Warning: EXPO_PUBLIC_GROQ_API_KEY is not defined. AI features will be unavailable.');
    }
  }

  private async generate(
    prompt: string,
    systemInstruction?: string,
    isJson?: boolean,
    imageUrl?: string,
    maxTokens?: number
  ): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq API key is not configured. Please add EXPO_PUBLIC_GROQ_API_KEY to your environment variables.');
    }

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    // Use vision model explicitly if an image is provided
    const modelToUse = imageUrl ? 'llama-3.2-90b-vision-preview' : this.modelName;

    const completionParams: any = {
      messages,
      model: modelToUse,
      response_format: isJson ? { type: 'json_object' } : { type: 'text' }
    };

    // Set max_tokens explicitly when the caller needs long-form output.
    // Without this, Groq defaults to ~1024 tokens which truncates detailed
    // explanations and revision notes for multi-page documents.
    if (maxTokens) {
      completionParams.max_tokens = maxTokens;
    }

    const completion = await this.groq.chat.completions.create(completionParams);

    return completion.choices[0]?.message?.content || '';
  }

  /**
   * Cleans a raw AI response string — strips markdown code fences,
   * leading/trailing whitespace, and BOM characters that break JSON.parse.
   */
  private cleanJsonText(text: string): string {
    let clean = text.trim();
    // Remove UTF-8 BOM
    if (clean.charCodeAt(0) === 0xfeff) clean = clean.slice(1);
    // Strip ```json ... ``` or ``` ... ``` wrappers
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    // Find the first { or [ and last } or ] to extract only the JSON body
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) start = firstBrace;
    else if (firstBracket !== -1) start = firstBracket;
    if (start > 0) clean = clean.slice(start);
    return clean;
  }

  /**
   * Parses JSON with automatic one-time retry using a stricter prompt.
   * On first failure: retries with JSON_RETRY_SUFFIX appended.
   * On second failure: throws a user-friendly error message.
   */
  private async parseJsonWithRetry(
    rawText: string,
    prompt: string,
    systemInstruction: string
  ): Promise<any> {
    const firstClean = this.cleanJsonText(rawText);
    try {
      return JSON.parse(firstClean);
    } catch (e1) {
      console.warn('[AI] First JSON parse failed, retrying with stricter prompt…', e1);
      try {
        // Second attempt: append explicit retry instruction to the system prompt
        const retrySystem = systemInstruction + JSON_RETRY_SUFFIX;
        const retryText = await this.generate(prompt, retrySystem, true);
        const retryClean = this.cleanJsonText(retryText);
        return JSON.parse(retryClean);
      } catch (e2) {
        console.error('[AI] Second JSON parse also failed:', e2);
        throw new Error('Unable to generate content. Please try again.');
      }
    }
  }

  async generateContent(input: AIModelInput, systemPrompt?: string): Promise<string> {
    const prompt = buildContextPrompt(input);
    return await this.generate(prompt, systemPrompt || SYSTEM_PROMPTS.STUDY_ASSISTANT);
  }


  async suggestTags(input: AIModelInput): Promise<string[]> {
    const contextPrompt = buildContextPrompt(input);
    const text = await this.generate(contextPrompt, SYSTEM_PROMPTS.TAG_SUGGESTION);
    if (!text) return [];
    return text
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
  }

  async generateSummary(text: string): Promise<string> {
    const textResult = await this.generate(text, SYSTEM_PROMPTS.SUMMARY_SYSTEM_PROMPT);
    return textResult || '';
  }

  async generateQuiz(input: AIModelInput) {
    const isRegeneration = input.previousQuestions && input.previousQuestions.length > 0;
    const prompt = isRegeneration
      ? buildQuizRegenerationPrompt(input)
      : buildContextPrompt(input);
    const systemPrompt = isRegeneration
      ? SYSTEM_PROMPTS.QUIZ_REGENERATION_SYSTEM_PROMPT
      : SYSTEM_PROMPTS.QUIZ_SYSTEM_PROMPT;

    const text = await this.generate(prompt, systemPrompt, true);
    if (!text) throw new Error('Unable to generate quiz. Please try again.');

    const parsed = await this.parseJsonWithRetry(text, prompt, systemPrompt);

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Unable to generate quiz. Please try again.');
    }

    // Validate each question has the required structure; drop malformed ones
    const validQuestions = parsed.questions.filter((q: any) =>
      typeof q.question === 'string' &&
      Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.correctAnswer === 'string' &&
      q.options.includes(q.correctAnswer) &&
      typeof q.explanation === 'string'
    );

    if (validQuestions.length === 0) {
      throw new Error('Unable to generate quiz. Please try again.');
    }

    if (parsed.warning) {
      console.warn('[QuizGen] AI regeneration warning:', parsed.warning);
    }

    return {
      questions: validQuestions,
      aiGeneratedAt: Date.now(),
      regenerationWarning: parsed.warning as string | undefined,
    };
  }


  async generateViva(input: AIModelInput) {
    const prompt = buildContextPrompt(input);
    const text = await this.generate(prompt, SYSTEM_PROMPTS.VIVA_SYSTEM_PROMPT, true);
    if (!text) throw new Error('Unable to generate viva questions. Please try again.');
    const parsed = await this.parseJsonWithRetry(text, prompt, SYSTEM_PROMPTS.VIVA_SYSTEM_PROMPT);
    return {
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      aiGeneratedAt: Date.now()
    };
  }

  async generateExplanation(input: AIModelInput) {
    const prompt = buildContextPrompt(input);
    // Use max_tokens: 8192 so long explanations are never cut off mid-sentence.
    const text = await this.generate(prompt, SYSTEM_PROMPTS.EXPLAIN_SYSTEM_PROMPT, false, undefined, 8192);
    if (!text) throw new Error('Unable to generate explanation. Please try again.');
    return {
      explanation: text,
      aiGeneratedAt: Date.now()
    };
  }

  async generateRevisionNotes(input: AIModelInput) {
    const prompt = buildContextPrompt(input);
    // Use max_tokens: 8192 for comprehensive revision notes across all sections.
    const text = await this.generate(prompt, SYSTEM_PROMPTS.REVISION_NOTES_SYSTEM_PROMPT, true, undefined, 8192);
    if (!text) throw new Error('Unable to generate revision notes. Please try again.');
    const parsed = await this.parseJsonWithRetry(text, prompt, SYSTEM_PROMPTS.REVISION_NOTES_SYSTEM_PROMPT);
    return {
      overview: typeof parsed.overview === 'string' ? parsed.overview : undefined,
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
      definitions: Array.isArray(parsed.definitions) ? parsed.definitions : [],
      formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
      tables: Array.isArray(parsed.tables) ? parsed.tables : [],
      properties: Array.isArray(parsed.properties) ? parsed.properties : [],
      importantLists: Array.isArray(parsed.importantLists) ? parsed.importantLists : [],
      importantPoints: Array.isArray(parsed.importantPoints) ? parsed.importantPoints : [],
      commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
      examPoints: Array.isArray(parsed.examPoints) ? parsed.examPoints : [],
      oneDayNotes: Array.isArray(parsed.oneDayNotes) ? parsed.oneDayNotes : [],
      memoryTricks: Array.isArray(parsed.memoryTricks) ? parsed.memoryTricks : [],
      aiGeneratedAt: Date.now()
    };
  }

  async extractTextFromImage(imageUrl: string): Promise<string> {
    const prompt = `Extract all text from this image exactly as written. Preserve paragraphs, headings, bullet points, and tables as closely as possible. 
Do not include any introductory remarks, explanations, or concluding statements. Output ONLY the extracted text.`;
    const text = await this.generate(prompt, undefined, false, imageUrl);
    if (!text) return '';
    return text.trim();
  }
}
