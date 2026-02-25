// server/src/services/openrouterService.ts

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { getAIStrategy, getProfileDescription, parseProfileCode } from '../config/profileSystem';

// Read environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const AI_MODEL = process.env.AI_MODEL || 'deepseek/deepseek-r1';
const APP_NAME = process.env.APP_NAME || 'adaptive-practice';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Debug output
console.log('🔧 OpenRouter Service Initialized:');
console.log(`   API Key: ${OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 15) + '...' : '❌ NOT SET'}`);
console.log(`   Model: ${AI_MODEL}`);
console.log(`   Base URL: ${OPENROUTER_BASE_URL}`);
console.log(`   Using: Parametric Profile System ✅\n`);

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY is not set. Using fallback feedback.');
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
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'sk-or-v1-YOUR_KEY_HERE') {
    throw new Error('OpenRouter API key not configured');
  }

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
        timeout: 30000,
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
 * Generate corrective feedback (wrong answer) - Uses Parametric Profile System
 */
export async function generateCorrectiveFeedback(params: {
  profileCode: string;
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  attemptNumber: number;
  imageDescription?: string;
}): Promise<string> {
  const { profileCode, questionText, correctAnswer, studentAnswer, attemptNumber, imageDescription } = params;

  // Get AI strategy from parametric profile system
  const strategy = getAIStrategy(profileCode);
  const description = getProfileDescription(profileCode);
  const profileParams = parseProfileCode(profileCode);

  // Get hint for current attempt (0-indexed array, so attemptNumber - 1)
  const currentHint = strategy.correctiveFeedback.hintProgression[Math.min(attemptNumber - 1, 2)];

  const systemPrompt = `Kamu adalah tutor AI yang menggunakan **CORRECTIVE FEEDBACK dengan pendekatan Reinforcement Learning**.

**PRINSIP INTI:**
1. ❌ JANGAN PERNAH menyebutkan jawaban yang benar atau opsi (A/B/C/D)
2. 💪 SELALU mulai dengan validasi emosional positif
3. 📈 Hint makin detail seiring attempt meningkat (scaffolding)

**STUDENT PROFILE (${profileCode}):**
${description}

**AI FEEDBACK STRATEGY FOR THIS PROFILE:**
- **Max Words:** ${strategy.correctiveFeedback.maxWords} KATA (STRICT LIMIT!)
- **Tone:** ${strategy.correctiveFeedback.tone}
- **Opening:** ${strategy.correctiveFeedback.openingPhrase}
- **Structure:** ${strategy.correctiveFeedback.structure}
- **Visual Style:** ${strategy.correctiveFeedback.visualStyle}
- **Closing:** ${strategy.correctiveFeedback.closingStyle}

**ATTEMPT ${attemptNumber}/3 - HINT STRATEGY:**
${currentHint}

**STRUKTUR OUTPUT WAJIB:**
1. **[VALIDASI POSITIF]** - ${strategy.correctiveFeedback.openingPhrase}
2. **[HINT ADAPTIF]** - ${currentHint}
3. **[PERTANYAAN PEMANDU]** - ${strategy.correctiveFeedback.closingStyle}

**ATURAN KERAS:**
- Bahasa Indonesia natural & friendly
- MAKSIMAL ${strategy.correctiveFeedback.maxWords} KATA
- ${profileParams.processing === 'G' ? '🌍 WAJIB mulai dari big picture' : '🔍 Breakdown step-by-step sistematis'}
- ${strategy.correctiveFeedback.visualStyle}
- NO opsi jawaban (A/B/C/D)
- NO reveal answer`;

  const userPrompt = `SOAL:
${questionText}

${imageDescription ? `📊 VISUAL CONTEXT:\n${imageDescription}\n` : ''}

JAWABAN BENAR: ${correctAnswer}
JAWABAN SISWA: ${studentAnswer} ❌ (SALAH)
ATTEMPT: ${attemptNumber}/3

Berikan corrective feedback sesuai strategi profil ${profileCode}:`;

  const feedback = await callOpenRouter(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      maxTokens: Math.round(strategy.correctiveFeedback.maxWords * 2.5),
      temperature: 0.8,
    }
  );

  return feedback;
}

/**
 * Generate positive reinforcement (correct answer) - Uses Parametric Profile System
 */
export async function generateExplanation(params: {
  profileCode: string;
  questionText: string;
  correctAnswer: string;
  attemptNumber: number;
  imageDescription?: string;
}): Promise<string> {
  const { profileCode, questionText, correctAnswer, attemptNumber, imageDescription } = params;

  // Get AI strategy from parametric profile system
  const strategy = getAIStrategy(profileCode);
  const description = getProfileDescription(profileCode);
  const profileParams = parseProfileCode(profileCode);

  // Reward tone based on attempt
  const rewardTones = [
    '🎉 LUAR BIASA! Langsung benar di percobaan pertama!',
    '✅ Bagus! Kamu berhasil setelah berpikir ulang!',
    '👏 Akhirnya benar! Persistence kamu keren!'
  ];
  const praise = rewardTones[Math.min(attemptNumber - 1, 2)];

  const systemPrompt = `Kamu adalah tutor AI yang memberikan **POSITIVE REINFORCEMENT & VALIDASI**.

**PRINSIP INTI:**
1. 🎉 VALIDASI kesuksesan dengan antusias!
2. 💡 EXPLAIN mengapa jawaban benar (reinforce understanding)
3. 🌟 HUBUNGKAN ke konsep lebih luas (transfer learning)

**STUDENT PROFILE (${profileCode}):**
${description}

**AI FEEDBACK STRATEGY FOR THIS PROFILE:**
- **Max Words:** ${strategy.positiveReinforcement.maxWords} KATA
- **Enthusiasm:** ${strategy.positiveReinforcement.enthusiasmLevel}
- **Praise Style:** ${strategy.positiveReinforcement.praiseStyle}
- **Explanation Depth:** ${strategy.positiveReinforcement.explanationDepth}

**ATTEMPT ${attemptNumber}/3 - REWARD:**
${praise}

**STRUKTUR OUTPUT WAJIB:**
1. **[VALIDASI ENTHUSIASTIC]** - ${praise}
2. **[EXPLAIN WHY CORRECT]** - ${strategy.positiveReinforcement.explanationDepth}
3. **[BROADER CONCEPT]** - Hubungkan ke konsep lebih luas (1 kalimat)

**ATURAN KERAS:**
- Bahasa Indonesia enthusiastic & educational
- MAKSIMAL ${strategy.positiveReinforcement.maxWords} KATA
- ${profileParams.processing === 'G' ? '🌍 Mulai dari konsep besar' : '🔍 Trace reasoning step-by-step'}
- Tone: Celebratory but still educational`;

  const userPrompt = `SOAL:
${questionText}

${imageDescription ? `📊 VISUAL CONTEXT:\n${imageDescription}\n` : ''}

JAWABAN BENAR: ${correctAnswer} ✅
ATTEMPT: ${attemptNumber}/3

Berikan positive reinforcement sesuai profil ${profileCode}:`;

  const explanation = await callOpenRouter(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      maxTokens: Math.round(strategy.positiveReinforcement.maxWords * 2.5),
      temperature: 0.8,
    }
  );

  return explanation;
}

/**
 * Generate detailed walkthrough (post-correct explanation) - Uses Parametric Profile System
 */
export async function generateDetailedWalkthrough(params: {
  profileCode: string;
  questionText: string;
  correctAnswer: string;
  allOptions: string[];
  imageDescription?: string;
}): Promise<string> {
  const { profileCode, questionText, correctAnswer, allOptions, imageDescription } = params;

  // Get AI strategy from parametric profile system
  const strategy = getAIStrategy(profileCode);
  const description = getProfileDescription(profileCode);

  const systemPrompt = `Kamu adalah AI tutor yang memberikan **DETAILED WALKTHROUGH** untuk soal computational thinking yang sudah dijawab benar.

**TUJUAN:**
Jelaskan langkah-langkah pengerjaan secara detail dan personalized, sehingga siswa paham CARA BERPIKIR yang benar.

**STUDENT PROFILE (${profileCode}):**
${description}

**AI WALKTHROUGH STRATEGY FOR THIS PROFILE:**
- **Max Words:** ${strategy.detailedWalkthrough.maxWords} KATA
- **Approach:** ${strategy.detailedWalkthrough.approach}
- **Structure:** ${strategy.detailedWalkthrough.structure}
- **Starting Point:** ${strategy.detailedWalkthrough.startingPoint}
- **Detail Level:** ${strategy.detailedWalkthrough.detailLevel}
- **Visual Style:** ${strategy.detailedWalkthrough.visualStyle}

**STRUKTUR OUTPUT:**
${strategy.detailedWalkthrough.structure}

**TONE & STYLE:**
- Educational & clear (bukan celebratory - ini explanatory)
- ${strategy.detailedWalkthrough.visualStyle}

**ATURAN KERAS:**
- Bahasa Indonesia
- MAKSIMAL ${strategy.detailedWalkthrough.maxWords} KATA
- Gunakan numbering/bullet untuk struktur jelas
- Brief explain MENGAPA opsi lain salah (1-2 kalimat)`;

  const userPrompt = `SOAL:
${questionText}

${imageDescription ? `📊 VISUAL CONTEXT:\n${imageDescription}\n` : ''}

SEMUA OPSI JAWABAN:
${allOptions.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n')}

JAWABAN BENAR: ${correctAnswer}

Berikan detailed walkthrough sesuai profil ${profileCode}:`;

  const walkthrough = await callOpenRouter(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      maxTokens: Math.round(strategy.detailedWalkthrough.maxWords * 2.5),
      temperature: 0.7,
    }
  );

  return walkthrough;
}

/**
 * Generate feedback (unified interface) - Uses Parametric Profile System
 */
export async function generateFeedback(params: {
  questionText: string;
  questionTopic: string;
  userAnswer: string;
  correctAnswer: string;
  allOptions: string[];
  isCorrect: boolean;
  attemptCount: number;
  userProfile: string;
  difficulty: number;
  imageDescription?: string;
}): Promise<string> {
  const {
    questionText,
    userAnswer,
    correctAnswer,
    isCorrect,
    attemptCount,
    userProfile,
    imageDescription
  } = params;

  console.log('🤖 Generating AI feedback with Parametric Profile System...');
  console.log(`   Profile: ${userProfile}`);
  console.log(`   Description: ${getProfileDescription(userProfile)}`);
  console.log(`   Correct: ${isCorrect}, Attempt: ${attemptCount}`);

  try {
    if (isCorrect) {
      return await generateExplanation({
        profileCode: userProfile,
        questionText,
        correctAnswer,
        attemptNumber: attemptCount,
        imageDescription
      });
    } else {
      return await generateCorrectiveFeedback({
        profileCode: userProfile,
        questionText,
        correctAnswer,
        studentAnswer: userAnswer,
        attemptNumber: attemptCount,
        imageDescription
      });
    }
  } catch (error) {
    console.error('❌ AI generation failed, using fallback');
    
    // Enhanced fallback
    if (isCorrect) {
      const successFallbacks = [
        '🎉 Sempurna! Langsung benar di percobaan pertama!',
        '✅ Bagus! Kamu berhasil setelah mencoba lagi!',
        '👏 Akhirnya benar! Persistence kamu keren!'
      ];
      return successFallbacks[Math.min(attemptCount - 1, 2)];
    } else {
      const hintFallbacks = [
        '😊 Belum tepat, tapi gak apa-apa! Coba perhatikan konsep dasar dari soal ini. Apa prinsip utamanya? 🤔',
        '💪 Belum benar, tapi tetap semangat! Fokus ke bagian mana yang mungkin terlewat. Coba trace langkah-langkahnya satu per satu.',
        '🎯 Ayo, hampir! Mari breakdown step-by-step: identifikasi setiap operasi yang terjadi, lalu cek hasil akhirnya.'
      ];
      return hintFallbacks[Math.min(attemptCount - 1, 2)];
    }
  }
}

// Default export
export default {
  callOpenRouter,
  generateCorrectiveFeedback,
  generateExplanation,
  generateDetailedWalkthrough,
  generateFeedback,
};