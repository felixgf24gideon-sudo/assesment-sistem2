"use strict";
// server/src/services/openrouterFeedbackService.ts
// FEEDBACK PROMPTS - Personalisasi feedback HANYA untuk di sini!
// Milik: Felix (tim feedback)
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCorrectiveFeedbackForResearch = generateCorrectiveFeedbackForResearch;
exports.generateCorrectiveFeedback = generateCorrectiveFeedback;
const profileSystem_1 = require("../config/profileSystem");
const openrouterClient_1 = require("./openrouterClient");
/**
 * Generate corrective feedback for RESEARCH/EVALUATION
 * SIMPLIFIED PROMPT - Better results with less complexity
 *
 * Personalisasi: Level, Modality, Structure, Tempo
 */
async function generateCorrectiveFeedbackForResearch(params) {
    const { profileCode, questionText, userAnswer, correctAnswer, allOptions } = params;
    const description = (0, profileSystem_1.getProfileDescription)(profileCode);
    // Parse profile
    const level = parseInt(profileCode[0]);
    const modality = profileCode[1]; // T or P
    const structure = profileCode[2]; // G or A
    const tempo = profileCode[3]; // I or R
    // Simple, clear guidance
    const wordTarget = tempo === 'I' ? '60-80 kata' : '150-250 kata';
    const styleGuide = modality === 'T'
        ? 'Gunakan penjelasan logis ("karena", "sehingga")'
        : 'Gunakan bahasa visual dan analogi ("bayangkan", "seperti")';
    const structureGuide = structure === 'G'
        ? 'Mulai dari konsep besar, lalu detail'
        : 'Jelaskan step-by-step secara sistematis';
    const levelGuide = level <= 2
        ? 'bahasa sangat sederhana'
        : level <= 4
            ? 'bahasa moderate'
            : 'reasoning advanced';
    const systemPrompt = `Kamu adalah AI tutor yang memberikan corrective feedback berkualitas tinggi.

PROFIL SISWA: ${profileCode}
${description}

PERSONALISASI:
- Panjang: ${wordTarget} (WAJIB!)
- Level: ${levelGuide}
- Gaya: ${styleGuide}
- Struktur: ${structureGuide}

KUALITAS WAJIB:
1. Jelaskan MENGAPA ${userAnswer} SALAH (spesifik!)
2. Identifikasi kesalahan konsep yang terjadi
3. Tunjukkan cara berpikir yang benar
4. Bahasa supportive dan membangun
5. Spesifik pada error ini, bukan generic

${tempo === 'I'
        ? 'PENTING: Jadilah CONCISE - langsung to the point dalam ' + wordTarget + '!'
        : 'Berikan penjelasan DETAIL dan thorough dalam ' + wordTarget + '.'}

Bahasa Indonesia, natural, educational.`;
    const userPrompt = `Soal:
${questionText}

Opsi:
${allOptions.join('\n')}

Jawaban siswa (SALAH): ${userAnswer}
Jawaban benar: ${correctAnswer}

Berikan feedback yang:
- Jelaskan mengapa ${userAnswer} salah
- Tunjukkan reasoning error
- Guide ke pemahaman benar
- Panjang: ${wordTarget}
- Sesuai profil ${profileCode}

Feedback (Bahasa Indonesia):`;
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
    ];
    const feedback = await (0, openrouterClient_1.callOpenRouter)(messages, {
        maxTokens: tempo === 'I' ? 250 : 600,
        temperature: 0.7,
    });
    return feedback;
}
// Alias untuk compatibility dengan script lama
async function generateCorrectiveFeedback(params) {
    return generateCorrectiveFeedbackForResearch(params);
}
exports.default = {
    generateCorrectiveFeedbackForResearch,
    generateCorrectiveFeedback,
};
