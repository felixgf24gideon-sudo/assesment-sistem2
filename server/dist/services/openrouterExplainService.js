"use strict";
// server/src/services/openrouterExplainService.ts
// AI EXPLAINED SERVICE - Single Output Version
// 
// Prompt Engineering + API Calling dalam 1 file
// INDEPENDENT dari feedback system
// OUTPUT: 1 explanation per question
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExplanation = generateExplanation;
const openrouterClient_1 = require("./openrouterClient");
/**
 * Parse cognitive type dari profile code
 * Example: 3TGI → level=3, cognitive=TGI
 */
function parseCognitive(profileCode) {
    const level = parseInt(profileCode[0]); // 1-6
    const cognitive = profileCode.substring(1); // TGI, PAR, etc
    const modality = cognitive[0] === 'T' ? 0 : 1; // 0=Text, 1=Picture
    const processing = cognitive[1] === 'G' ? 0 : 1; // 0=Global, 1=Analytic
    const response = cognitive[2] === 'I' ? 0 : 1; // 0=Impulsive, 1=Reflective
    return { level, cognitive, modality, processing, response };
}
/**
 * ═══════════════════════════════════════════════════════════════
 * SECTION 1: ADAPTIVE GUIDANCE RULES
 *
 * EDIT INI UNTUK CUSTOMIZE ADAPTIVE RULES!
 * ═══════════════════════════════════════════════════════════════
 */
function getAdaptiveGuidance(parsed) {
    const { level, modality, processing, response } = parsed;
    let rules = '';
    // ===== EDIT FROM HERE =====
    // DIMENSION 1: Information Modality
    if (modality === 0) {
        // TEXT LEARNER
        rules += '- Use clear textual explanation with logical flow.\n';
        rules += '- Use phrases like "because", "therefore", "consequently".\n';
    }
    else {
        // PICTURE LEARNER
        rules += '- Use descriptive visual imagery and visual analogies.\n';
        rules += '- Use phrases like "imagine", "picture", "like".\n';
    }
    // DIMENSION 2: Processing Style
    if (processing === 0) {
        // GLOBAL THINKER
        rules += '- START from the overall idea/big picture FIRST.\n';
        rules += '- Then connect details to the main concept.\n';
        rules += '- Show how parts relate to the whole.\n';
    }
    else {
        // ANALYTIC THINKER
        rules += '- Explain reasoning STEP-BY-STEP systematically.\n';
        rules += '- Build from specific details to general understanding.\n';
        rules += '- Show each reasoning step sequentially.\n';
    }
    // DIMENSION 3: Response Style
    if (response === 0) {
        // IMPULSIVE LEARNER
        rules += '- Keep explanation SHORT and DIRECT.\n';
        rules += '- Avoid unnecessary details.\n';
        rules += '- Target: 50-100 words.\n';
    }
    else {
        // REFLECTIVE LEARNER
        rules += '- Provide DETAILED and THOROUGH explanation.\n';
        rules += '- Include reasoning and justification.\n';
        rules += '- Target: 150-300 words.\n';
    }
    // PEDAGOGIC LEVEL
    if (level <= 2) {
        rules += '- Use VERY SIMPLE language and basic concepts.\n';
        rules += '- Avoid technical terminology.\n';
    }
    else if (level <= 4) {
        rules += '- Use MODERATE language complexity.\n';
        rules += '- Balance between simple and technical terms.\n';
    }
    else {
        rules += '- Use ADVANCED reasoning and sophisticated concepts.\n';
        rules += '- Can include technical terminology.\n';
    }
    // ===== END EDIT =====
    return rules;
}
/**
 * Get profile description (self-contained)
 */
function getProfileDescription(profileCode) {
    const parsed = parseCognitive(profileCode);
    const { level, modality, processing, response } = parsed;
    const levelNames = ['', 'Beginner', 'Beginner-Intermediate', 'Intermediate',
        'Intermediate-Advanced', 'Advanced', 'Expert'];
    const levelDesc = levelNames[level] || 'Intermediate';
    const modalityDesc = modality === 0 ? 'text-based' : 'visual-based';
    const processingDesc = processing === 0 ? 'global thinker' : 'analytic thinker';
    const responseDesc = response === 0 ? 'impulsive' : 'reflective';
    return `${levelDesc}, ${modalityDesc} learner, ${processingDesc}, ${responseDesc} learner.`;
}
/**
 * ═══════════════════════════════════════════════════════════════
 * SECTION 2: EXPLANATION PROMPT
 *
 * EDIT INI UNTUK CUSTOMIZE SYSTEM PROMPT!
 * ═══════════════════════════════════════════════════════════════
 */
function getExplanationSystemPrompt(profileCode, parsed, adaptiveGuidance) {
    // ===== EDIT FROM HERE =====
    const systemPrompt = `Kamu adalah educational AI yang generate adaptive explanation.

COGNITIVE PROFILE: ${profileCode}
- Level: ${parsed.level}/6
- Modality: ${parsed.modality === 0 ? 'Text' : 'Picture'} learner
- Processing: ${parsed.processing === 0 ? 'Global' : 'Analytic'} thinker
- Response: ${parsed.response === 0 ? 'Impulsive' : 'Reflective'} learner

Profile: ${getProfileDescription(profileCode)}

ADAPTIVE EXPLANATION RULES:
${adaptiveGuidance}

STRUCTURE:
1. Explain WHY the answer is correct
2. Connect to broader concept (1 sentence)

TONE: Supportive, encouraging, educational
LANGUAGE: Bahasa Indonesia, natural, clear`;
    // ===== END EDIT =====
    return systemPrompt;
}
/**
 * ═══════════════════════════════════════════════════════════════
 * SECTION 3: USER PROMPT
 *
 * EDIT INI UNTUK CUSTOMIZE USER PROMPT!
 * ═══════════════════════════════════════════════════════════════
 */
function getExplanationUserPrompt(profileCode, questionText, correctAnswer) {
    // ===== EDIT FROM HERE =====
    const userPrompt = `Soal:
${questionText}

Jawaban benar: ${correctAnswer}

Berikan explanation untuk profil ${profileCode} dengan mengikuti adaptive rules.
Explanation (Bahasa Indonesia):`;
    // ===== END EDIT =====
    return userPrompt;
}
/**
 * ═══════════════════════════════════════════════════════════════
 * SECTION 4: CONFIGURATION
 *
 * EDIT INI UNTUK CUSTOMIZE MAX TOKENS, TEMPERATURE!
 * ═══════════════════════════════════════════════════════════════
 */
const PROMPT_CONFIG = {
    explanation: {
        maxTokensImpulsive: 250, // Short for impulsive learners
        maxTokensReflective: 600, // Long for reflective learners
        temperature: 0.7, // Creativity level (0.0-1.0)
    },
};
/**
 * ═══════════════════════════════════════════════════════════════
 * MAIN FUNCTION - Generate Explanation
 * ═══════════════════════════════════════════════════════════════
 */
/**
 * Generate explanation (SINGLE OUTPUT)
 */
async function generateExplanation(params) {
    const { profileCode, questionText, correctAnswer } = params;
    const parsed = parseCognitive(profileCode);
    const adaptiveGuidance = getAdaptiveGuidance(parsed);
    const systemPrompt = getExplanationSystemPrompt(profileCode, parsed, adaptiveGuidance);
    const userPrompt = getExplanationUserPrompt(profileCode, questionText, correctAnswer);
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
    ];
    const maxTokens = parsed.response === 0
        ? PROMPT_CONFIG.explanation.maxTokensImpulsive
        : PROMPT_CONFIG.explanation.maxTokensReflective;
    const explanation = await (0, openrouterClient_1.callOpenRouter)(messages, {
        maxTokens,
        temperature: PROMPT_CONFIG.explanation.temperature,
    });
    return explanation;
}
exports.default = {
    generateExplanation,
};
