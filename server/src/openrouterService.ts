// server/src/services/openrouterService.ts
import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const AI_MODEL = process.env.AI_MODEL || 'deepseek/deepseek-r1';
const APP_NAME = process.env.APP_NAME || 'adaptive-practice';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set in environment variables');
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter API (OpenAI-compatible)
 */
export async function callOpenRouter(
  messages: ChatMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  try {
    const response = await axios.post<OpenRouterResponse>(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: AI_MODEL,
        messages,
        max_tokens: options.maxTokens || 200,
        temperature: options.temperature || 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': APP_URL,
          'X-Title': APP_NAME,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30s timeout
      }
    );

    const content = response.data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    console.log('✅ OpenRouter API call successful');
    console.log(`   Model: ${response.data.model}`);
    console.log(`   Tokens: ${response.data.usage.total_tokens}`);

    return content.trim();
  } catch (error: any) {
    console.error('❌ OpenRouter API error:', error.response?.data || error.message);
    throw new Error(`OpenRouter API failed: ${error.message}`);
  }
}

/**
 * Generate corrective feedback (saat jawaban salah)
 */
export async function generateCorrectiveFeedback(params: {
  profileCode: string;
  pedagogicLevel: number;
  visualPreference: 'T' | 'P';
  processingOrientation: 'G' | 'A';
  behavioralTempo: 'I' | 'R';
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  attemptNumber: number;
}): Promise<string> {
  const {
    profileCode,
    pedagogicLevel,
    visualPreference,
    processingOrientation,
    behavioralTempo,
    questionText,
    correctAnswer,
    studentAnswer,
    attemptNumber,
  } = params;

  // Build adaptive system prompt
  const systemPrompt = `You are an adaptive learning tutor for computational thinking.

STUDENT PROFILE (${profileCode}):
- Pedagogic Level: ${pedagogicLevel} (1=beginner, 6=expert)
- Visual Preference: ${visualPreference === 'T' ? 'Text-based (logical sentences)' : 'Picture-based (visual metaphors)'}
- Processing: ${processingOrientation === 'G' ? 'Global (big picture first)' : 'Analytic (step-by-step)'}
- Tempo: ${behavioralTempo === 'I' ? 'Impulsive (direct & concise)' : 'Reflective (elaborate & thoughtful)'}

ADAPTATION RULES:
1. Attempt ${attemptNumber}/3:
   ${attemptNumber === 1 ? '- Give subtle hint (guide toward pattern)' : ''}
   ${attemptNumber === 2 ? '- Give clearer hint (mention key concept)' : ''}
   ${attemptNumber >= 3 ? '- Be very direct (almost reveal answer)' : ''}

2. Level ${pedagogicLevel}:
   ${pedagogicLevel <= 2 ? '- Use simple language, avoid jargon' : ''}
   ${pedagogicLevel >= 3 && pedagogicLevel <= 4 ? '- Use moderate technical terms' : ''}
   ${pedagogicLevel >= 5 ? '- Use precise terminology' : ''}

3. Visual ${visualPreference}:
   ${visualPreference === 'T' ? '- Use logical, text-based explanations' : '- Use visual metaphors (e.g., "imagine a tree structure")'}

4. Processing ${processingOrientation}:
   ${processingOrientation === 'G' ? '- Start with big picture concept' : '- Break into clear steps'}

5. Tempo ${behavioralTempo}:
   ${behavioralTempo === 'I' ? '- Be direct and concise' : '- Encourage deeper thinking'}

RESPONSE FORMAT:
- Maximum 50 words
- Do NOT reveal the answer directly
- Guide the student toward understanding`;

  const userPrompt = `QUESTION:
${questionText}

CORRECT ANSWER: ${correctAnswer}
STUDENT'S ANSWER: ${studentAnswer} (INCORRECT)

Provide adaptive corrective feedback:`;

  const feedback = await callOpenRouter(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      maxTokens: 150,
      temperature: 0.7,
    }
  );

  return feedback;
}

/**
 * Generate explanatory feedback (saat jawaban benar)
 */
export async function generateExplanation(params: {
  profileCode: string;
  pedagogicLevel: number;
  visualPreference: 'T' | 'P';
  processingOrientation: 'G' | 'A';
  behavioralTempo: 'I' | 'R';
  questionText: string;
  correctAnswer: string;
  attemptNumber: number;
}): Promise<string> {
  const {
    profileCode,
    pedagogicLevel,
    visualPreference,
    processingOrientation,
    behavioralTempo,
    questionText,
    correctAnswer,
    attemptNumber,
  } = params;

  const systemPrompt = `You are an adaptive learning tutor for computational thinking.

STUDENT PROFILE (${profileCode}):
- Pedagogic Level: ${pedagogicLevel} (1=beginner, 6=expert)
- Visual: ${visualPreference === 'T' ? 'Text-based' : 'Picture-based'}
- Processing: ${processingOrientation === 'G' ? 'Global (big picture)' : 'Analytic (step-by-step)'}
- Tempo: ${behavioralTempo === 'I' ? 'Impulsive (concise)' : 'Reflective (elaborate)'}

TASK:
The student answered correctly after ${attemptNumber} attempt(s).
Provide congratulatory explanation of WHY the answer is correct.

ADAPTATION:
- Level ${pedagogicLevel}: ${pedagogicLevel <= 2 ? 'Reinforce basics' : pedagogicLevel <= 4 ? 'Add deeper insight' : 'Mention advanced connections'}
- Visual ${visualPreference}: ${visualPreference === 'T' ? 'Conceptual explanation' : 'Visual analogy'}
- Processing ${processingOrientation}: ${processingOrientation === 'G' ? 'Show broader pattern' : 'Break down reasoning'}
- Tempo ${behavioralTempo}: ${behavioralTempo === 'I' ? 'Concise, move forward' : 'Invite deeper thinking'}

FORMAT:
- Start with brief praise
- Explain WHY answer is correct
- Connect to broader concept
- Maximum 80 words`;

  const userPrompt = `QUESTION:
${questionText}

CORRECT ANSWER: ${correctAnswer}

Provide adaptive explanation:`;

  const explanation = await callOpenRouter(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      maxTokens: 250,
      temperature: 0.7,
    }
  );

  return explanation;
}

export default {
  callOpenRouter,
  generateCorrectiveFeedback,
  generateExplanation,
};