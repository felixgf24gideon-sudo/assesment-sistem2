// server/src/services/openrouterService.ts
// PERSONALIZATION-OPTIMIZED FOR 6-DIMENSION RUBRIC

import axios from 'axios';
import { ProfileParams, getAIStrategy } from '../config/profileSystem';
import {
  generateCorrectiveFeedback as legacyGenerateCorrectiveFeedback,
  generateExplanation as legacyGenerateExplanation,
} from '../openrouterService';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const GENERATION_MODEL = process.env.AI_MODEL || 'google/gemma-3-27b-it';

interface FeedbackGenerationRequest {
  profileCode?: string;
  profile?: ProfileParams;
  question: string;
  options: string[];
  studentAnswer: string;
  correctAnswer: string;
  attempt?: number;
}

interface FeedbackGenerationResponse {
  feedback: string;
  wordCount: number;
  dimensions: {
    targetTempo: 'I' | 'R';
    targetModality: 'T' | 'P';
    targetStructure: 'G' | 'A';
    motivationStyle: string;
  };
}

// ===== PARSE PROFILE =====
function getProfileFromRequest(req: FeedbackGenerationRequest): ProfileParams {
  if (req.profile) {
    return req.profile;
  }
  
  if (req.profileCode) {
    const parts = req.profileCode.toUpperCase();
    return {
      level: parseInt(parts[0]) || 3,
      visual: (parts[1] === 'P' ? 'P' : 'T') as 'T' | 'P',
      processing: (parts[2] === 'A' ? 'A' : 'G') as 'G' | 'A',
      tempo: (parts[3] === 'R' ? 'R' : 'I') as 'I' | 'R'
    };
  }
  
  // Default profile
  return {
    level: 3,
    visual: 'T',
    processing: 'G',
    tempo: 'I'
  };
}

// ===== WORD LIMIT CALCULATOR =====
function getWordLimitByProfile(tempo: 'I' | 'R'): {
  min: number;
  max: number;
  target: number;
} {
  return tempo === 'I'
    ? { min: 30, max: 100, target: 60 }
    : { min: 120, max: 300, target: 200 };
}

// ===== MODALITY INSTRUCTION =====
function getModalityInstruction(modality: 'T' | 'P'): string {
  if (modality === 'T') {
    return `
MODALITY: TEXT/LOGIC
Format: Logical sequences, formal reasoning, step-by-step proof
Structure:
  1. State the logical error precisely
  2. Show where logic breaks down
  3. Present correct logical chain
  4. Provide mathematical or formal proof
Language: Precise terminology, formal tone`;
  } else {
    return `
MODALITY: VISUAL/ANALOGY
Format: Vivid analogies, metaphors, conceptual imagery
Structure:
  1. Open with relatable analogy: "Bayangkan..."
  2. Draw parallel: "Sama seperti X ke Y..."
  3. Apply to problem: "Di sini, Z ke W..."
  4. Concrete example: "Konkretnya: [example]"
Language: Narrative, imagery-rich, conversational`;
  }
}

// ===== STRUCTURE INSTRUCTION =====
function getStructureInstruction(structure: 'G' | 'A'): string {
  if (structure === 'G') {
    return `
STRUCTURE: GLOBAL-FIRST
Order:
  1. State the BIG CONCEPT or main idea
  2. Explain how it breaks down into parts
  3. Point out the specific error in this case
  4. Summarize how it all fits together
Flow: Context → Details → Application`;
  } else {
    return `
STRUCTURE: ANALYTIC/STEP-BY-STEP
Order:
  1. Foundation or basic principle
  2. Build next layer
  3. Identify where reasoning failed
  4. Show correct progression
  5. Reach conclusion
Flow: Ground up → Logical chain → Result`;
  }
}

// ===== PERSONALIZED MOTIVATION =====
function getPersonalizedMotivation(profile: ProfileParams): string {
  const { tempo, processing } = profile;

  const motivationMap: Record<string, string> = {
    'IG': `Cepat tangkap gambaran besarnya! Sekarang hati-hati di detail.`,
    'IA': `Langkah logismu tajam! Pastikan urutan langkahnya benar.`,
    'RG': `Analisis mendalam sekali! Koneksi ke konsep utama yang kamu cari.`,
    'RA': `Penyelesaian step-by-step mu rapi! Coba perhatikan satu langkah lagi.`
  };

  const key = `${tempo}${processing}`;
  return motivationMap[key] || `Coba lagi! Kamu bisa lebih baik.`;
}

// ===== BUILD PERSONALIZED SYSTEM PROMPT =====
function buildPersonalizedSystemPrompt(profile: ProfileParams): string {
  const wordLimit = getWordLimitByProfile(profile.tempo);
  const modalityInstr = getModalityInstruction(profile.visual);
  const structureInstr = getStructureInstruction(profile.processing);
  const motivationStyle = getPersonalizedMotivation(profile);

  // Get additional strategy from profileSystem
  const strategy = getAIStrategy(`${profile.level}${profile.visual}${profile.processing}${profile.tempo}`);
  const tone = strategy.correctiveFeedback.tone;

  return `
You are an Adaptive Learning AI Tutor optimized for personalized feedback.

===== STUDENT COGNITIVE PROFILE =====

Level: ${profile.level}/6
Modality: ${profile.visual === 'T' ? 'TEXT/LOGIC' : 'VISUAL/ANALOGY'}
Structure: ${profile.processing === 'G' ? 'GLOBAL' : 'ANALYTIC'}
Tempo: ${profile.tempo === 'I' ? 'IMPULSIVE' : 'REFLECTIVE'}

===== TONE GUIDANCE =====
${tone}

===== CRITICAL OPTIMIZATION RULES =====

RULE 1: TEMPO ALIGNMENT (STRICTEST)
${profile.tempo === 'I'
  ? `- Word limit: EXACTLY 30-100 words (target: 60)
- First sentence MUST contain the diagnosis
- One key insight per paragraph
- Use bullet points if needed
- No elaboration; pure precision
- Get straight to the point`
  : `- Word limit: EXACTLY 120-300 words (target: 200)
- Multiple paragraphs OK
- Provide context and scaffolding
- Show connections between concepts
- Elaborate to support understanding
- Take time to explain thoroughly`
}

RULE 2: INSTRUCTIONAL QUALITY (SURGICAL PRECISION)
- Sentence 1: Identify EXACT misconception
- Sentence 2: State root cause
- Sentences 3+: Explain why & show correct reasoning
- Signal-to-Noise Ratio: >80% (every word essential)
- NO padding, NO filler, NO generic statements

RULE 3: MODALITY ALIGNMENT
${modalityInstr}

RULE 4: STRUCTURE ALIGNMENT
${structureInstr}

RULE 5: PERSONALIZED MOTIVATION (NOT GENERIC)
- DO NOT use: "Good job!", "Try again!", "Keep going!"
- DO use: "${motivationStyle}"
- Reference this learner's cognitive style specifically

===== FORMAT TEMPLATE =====

[DIAGNOSIS - 1-2 sentences]
Identify the misconception precisely.

[EXPLANATION - 3-${profile.tempo === 'I' ? 3 : 5} sentences]
Explain why it's wrong, what's correct, why the difference matters.

[PERSONALIZED MOTIVATION - 1 sentence]
${motivationStyle}

===== CONSTRAINTS =====
- Language: Indonesian
- Word count: ${wordLimit.min}-${wordLimit.max} words (HARD LIMIT)
- Do NOT exceed limits
- Every sentence must serve learning purpose
- Do NOT use generic praise
- Do NOT use irrelevant context

===== START FEEDBACK NOW =====
`;
}

// ===== GENERATE PERSONALIZED FEEDBACK =====
export async function generateAdaptiveFeedback(
  req: FeedbackGenerationRequest
): Promise<FeedbackGenerationResponse> {
  const profile = getProfileFromRequest(req);
  const { question, options, studentAnswer, correctAnswer, attempt } = req;

  const systemPrompt = buildPersonalizedSystemPrompt(profile);
  const userPrompt = `
Question:
${question}

Options:
${options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n')}

Student's (Wrong) Answer: ${studentAnswer}
Correct Answer: ${correctAnswer}

Generate personalized corrective feedback for this student.
`;

  try {
    const response = await axios.post<any>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: GENERATION_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 600,
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Adaptive Practice - Personalized Feedback',
          'Content-Type': 'application/json'
        }
      }
    );

    const feedback = response.data?.choices?.[0]?.message?.content?.trim() || '';
    const wordCount = feedback.split(/\s+/).length;

    // Validate against hard rules
    const wordLimit = getWordLimitByProfile(profile.tempo);
    if (wordCount < wordLimit.min || wordCount > wordLimit.max) {
      console.warn(
        `⚠️ Word count ${wordCount} violates limits [${wordLimit.min}-${wordLimit.max}]`
      );
    }

    return {
      feedback,
      wordCount,
      dimensions: {
        targetTempo: profile.tempo,
        targetModality: profile.visual,
        targetStructure: profile.processing,
        motivationStyle: getPersonalizedMotivation(profile)
      }
    };
  } catch (error: any) {
    console.error(' Feedback generation error:', error.message);
    throw error;
  }
}

// ===== RESEARCH-SPECIFIC VERSION =====
export async function generateCorrectiveFeedbackForResearch(req: {
  profileCode: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  allOptions: string[];
}): Promise<string> {
  const profileParts = req.profileCode.toUpperCase();
  const profile: ProfileParams = {
    level: parseInt(profileParts[0]) || 3,
    visual: (profileParts[1] === 'P' ? 'P' : 'T') as 'T' | 'P',
    processing: (profileParts[2] === 'A' ? 'A' : 'G') as 'G' | 'A',
    tempo: (profileParts[3] === 'R' ? 'R' : 'I') as 'I' | 'R'
  };

  const response = await generateAdaptiveFeedback({
    profile,
    question: req.questionText,
    options: req.allOptions,
    studentAnswer: req.userAnswer,
    correctAnswer: req.correctAnswer,
    attempt: 1
  });

  return response.feedback;
}

function getProfileFromCode(profileCode: string) {
  const parts = (profileCode || '3TGI').toUpperCase();

  return {
    profileCode: parts,
    pedagogicLevel: parseInt(parts[0]) || 3,
    visualPreference: (parts[1] === 'P' ? 'P' : 'T') as 'T' | 'P',
    processingOrientation: (parts[2] === 'A' ? 'A' : 'G') as 'G' | 'A',
    behavioralTempo: (parts[3] === 'R' ? 'R' : 'I') as 'I' | 'R',
  };
}

export async function generateFeedback(params: {
  questionText: string;
  questionTopic?: string;
  userAnswer?: string;
  studentAnswer?: string;
  correctAnswer: string;
  allOptions?: string[];
  isCorrect?: boolean;
  attemptCount?: number | string;
  attemptNumber?: number | string;
  profileCode?: string;
  userProfile?: string;
  pedagogicLevel?: number;
  visualPreference?: 'T' | 'P';
  processingOrientation?: 'G' | 'A';
  behavioralTempo?: 'I' | 'R';
  difficulty?: number | string;
  imageDescription?: string;
}): Promise<string> {
  const profile = getProfileFromCode(params.profileCode || params.userProfile || '3TGI');
  const attemptNum = parseInt(String(params.attemptCount || params.attemptNumber || 1)) || 1;

  if (params.isCorrect) {
    return legacyGenerateExplanation({
      profileCode: profile.profileCode,
      pedagogicLevel: profile.pedagogicLevel,
      visualPreference: profile.visualPreference,
      processingOrientation: profile.processingOrientation,
      behavioralTempo: profile.behavioralTempo,
      questionText: params.questionText,
      correctAnswer: params.correctAnswer,
      attemptNumber: attemptNum,
    });
  }

  return legacyGenerateCorrectiveFeedback({
    profileCode: profile.profileCode,
    pedagogicLevel: profile.pedagogicLevel,
    visualPreference: profile.visualPreference,
    processingOrientation: profile.processingOrientation,
    behavioralTempo: profile.behavioralTempo,
    questionText: params.questionText,
    correctAnswer: params.correctAnswer,
    studentAnswer: params.userAnswer || params.studentAnswer || '',
    attemptNumber: attemptNum,
  });
}

export async function generateCorrectiveFeedback(params: {
  questionText: string;
  questionTopic?: string;
  userAnswer?: string;
  studentAnswer?: string;
  correctAnswer: string;
  allOptions?: string[];
  isCorrect?: boolean;
  attemptCount?: number | string;
  attemptNumber?: number | string;
  profileCode?: string;
  userProfile?: string;
  pedagogicLevel?: number;
  visualPreference?: 'T' | 'P';
  processingOrientation?: 'G' | 'A';
  behavioralTempo?: 'I' | 'R';
  difficulty?: number | string;
  imageDescription?: string;
}): Promise<string> {
  return generateFeedback(params);
}

export async function generateDetailedWalkthrough(params: {
  profileCode: string;
  questionText: string;
  correctAnswer: string;
  allOptions?: string[];
  imageDescription?: string;
}): Promise<string> {
  const profile = getProfileFromCode(params.profileCode);

  return legacyGenerateExplanation({
    profileCode: profile.profileCode,
    pedagogicLevel: profile.pedagogicLevel,
    visualPreference: profile.visualPreference,
    processingOrientation: profile.processingOrientation,
    behavioralTempo: profile.behavioralTempo,
    questionText: params.questionText,
    correctAnswer: params.correctAnswer,
    attemptNumber: 1,
  });
}

export async function generateExplanation(params: {
  profileCode: string;
  pedagogicLevel?: number;
  visualPreference?: 'T' | 'P';
  processingOrientation?: 'G' | 'A';
  behavioralTempo?: 'I' | 'R';
  questionText: string;
  correctAnswer: string;
  attemptNumber?: number;
  imageDescription?: string;
}): Promise<string> {
  const profile = getProfileFromCode(params.profileCode);

  return legacyGenerateExplanation({
    profileCode: profile.profileCode,
    pedagogicLevel: params.pedagogicLevel || profile.pedagogicLevel,
    visualPreference: params.visualPreference || profile.visualPreference,
    processingOrientation: params.processingOrientation || profile.processingOrientation,
    behavioralTempo: params.behavioralTempo || profile.behavioralTempo,
    questionText: params.questionText,
    correctAnswer: params.correctAnswer,
    attemptNumber: params.attemptNumber || 1,
  });
}

export default {
  generateAdaptiveFeedback,
  generateCorrectiveFeedbackForResearch,
  generateFeedback,
  generateCorrectiveFeedback,
  generateDetailedWalkthrough,
  generateExplanation,
};

export { FeedbackGenerationRequest, FeedbackGenerationResponse };
