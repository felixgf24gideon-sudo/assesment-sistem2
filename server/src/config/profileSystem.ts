// server/src/config/profileSystem.ts

/**
 * PARAMETRIC PROFILE SYSTEM
 * 
 * Generates AI feedback strategies for 48 profiles algorithmically
 * Based on 4 core parameters: Level, Visual, Processing, Tempo
 * 
 * Eliminates need for 48 manual definitions (efficient & scalable)
 */

export type ProfileCode = string;

export interface ProfileParams {
  level: number;
  visual: 'T' | 'P';
  processing: 'G' | 'A';
  tempo: 'I' | 'R';
}

export interface AIStrategy {
  correctiveFeedback: {
    maxWords: number;
    tone: string;
    openingPhrase: string;
    hintProgression: string[];
    structure: string;
    visualStyle: string;
    closingStyle: string;
  };
  positiveReinforcement: {
    maxWords: number;
    enthusiasmLevel: string;
    praiseStyle: string;
    explanationDepth: string;
  };
  detailedWalkthrough: {
    maxWords: number;
    approach: string;
    structure: string;
    startingPoint: string;
    detailLevel: string;
    visualStyle: string;
  };
}

export function parseProfileCode(code: string): ProfileParams {
  const cleanCode = (code || '3TGI').toUpperCase().trim();
  
  return {
    level: parseInt(cleanCode[0]) || 3,
    visual: (cleanCode[1] === 'P' ? 'P' : 'T') as 'T' | 'P',
    processing: (cleanCode[2] === 'A' ? 'A' : 'G') as 'G' | 'A',
    tempo: (cleanCode[3] === 'R' ? 'R' : 'I') as 'I' | 'R'
  };
}

export function deriveAIStrategy(params: ProfileParams): AIStrategy {
  const { level, visual, processing, tempo } = params;
  
  const baseCorrectiveWords = tempo === 'I' ? 40 : 80;
  const levelMultiplier = 1 + ((level - 1) * 0.08);
  
  const correctiveWords = Math.round(baseCorrectiveWords * levelMultiplier);
  const positiveWords = Math.round(correctiveWords * 1.6);
  const walkthroughWords = Math.round(correctiveWords * (tempo === 'I' ? 2.5 : 3.5));
  
  let tone: string;
  if (level <= 2) {
    tone = 'Sangat supportif, hindari jargon teknis, gunakan bahasa sehari-hari yang sangat sederhana';
  } else if (level <= 4) {
    tone = 'Supportif dan encouraging, boleh gunakan istilah teknis moderat dengan penjelasan';
  } else {
    tone = 'Professional dan presisi, gunakan terminologi teknis yang tepat, assume prior knowledge';
  }
  
  const openingPhrases = {
    1: tempo === 'I' ? 'Belum tepat, tapi gak papa! 😊' : 'Belum tepat, tapi cara berpikirmu bagus! Mari coba lagi dengan lebih teliti.',
    2: tempo === 'I' ? 'Belum benar, ayo coba lagi! 💪' : 'Belum benar, tapi kamu sudah di jalur yang tepat. Mari analisis lebih dalam.',
    3: tempo === 'I' ? 'Belum tepat. Mari coba lagi.' : 'Belum benar. Mari kita review reasoning-nya bersama.',
    4: tempo === 'I' ? 'Belum tepat.' : 'Incorrect. Let\'s reconsider the approach.',
    5: tempo === 'I' ? 'Incorrect.' : 'Incorrect. Let\'s analyze the reasoning more carefully.',
    6: tempo === 'I' ? 'Incorrect.' : 'Incorrect. Reconsider the edge cases and underlying principles.'
  };
  const openingPhrase = openingPhrases[level as keyof typeof openingPhrases] || openingPhrases[3];
  
  let hintProgression: string[];
  
  if (processing === 'G') {
    if (tempo === 'I') {
      hintProgression = [
        'Attempt 1: Sebutkan konsep/prinsip umum yang relevan saja (sangat ringkas, no details)',
        'Attempt 2: Arahkan ke area konsep yang kurang tepat (still general)',
        'Attempt 3: Berikan overview solusi yang hampir lengkap, tapi jangan reveal jawaban exact'
      ];
    } else {
      hintProgression = [
        'Attempt 1: Jelaskan konsep besar dengan konteks yang cukup, ajak siswa refleksi tentang prinsip dasarnya',
        'Attempt 2: Breakdown area yang kurang dengan reasoning yang lebih dalam, guide pemikiran siswa ke arah yang benar',
        'Attempt 3: Elaborate overview solusi dengan detail reasoning step-by-step, tapi tetap biarkan siswa conclude sendiri'
      ];
    }
  } else {
    if (tempo === 'I') {
      hintProgression = [
        'Attempt 1: Tunjukkan langkah mana yang salah (direct & to-the-point)',
        'Attempt 2: Breakdown 2-3 langkah yang error secara ringkas',
        'Attempt 3: Hampir full step-by-step breakdown, very close ke jawaban tapi jangan reveal'
      ];
    } else {
      hintProgression = [
        'Attempt 1: Tunjukkan langkah yang error dengan explain reasoning mengapa itu salah',
        'Attempt 2: Breakdown step-by-step dengan analysis mendalam di tiap langkah',
        'Attempt 3: Comprehensive step-by-step guide dengan detail reasoning, tapi biarkan siswa execute sendiri'
      ];
    }
  }
  
  if (level >= 5) {
    hintProgression = hintProgression.map(hint => 
      hint.replace('Sebutkan', 'Consider')
         .replace('Tunjukkan', 'Identify')
         .replace('siswa', 'student')
    );
  }
  
  const structure = processing === 'G'
    ? (tempo === 'I' 
        ? 'Global-Simple: Konsep Kunci → Hint singkat → Pertanyaan pemandu (2-3 kalimat max)' 
        : 'Global-Elaborate: Konsep Kunci → Breakdown kontekstual → Ajakan refleksi mendalam (4-5 kalimat)')
    : (tempo === 'I'
        ? 'Analytic-Simple: Step 1 → Step 2 → Step 3 (maksimal 3 langkah, concise)'
        : 'Analytic-Elaborate: Step 1 (dengan reasoning) → Step 2 (dengan reasoning) → Reflection question');
  
  let visualStyle: string;
  if (visual === 'P') {
    if (level <= 2) {
      visualStyle = 'Gunakan emoji 2-3 untuk ilustrasi, sertakan analogi visual sederhana (misal: "seperti tumpukan piring 🍽️", "seperti antrian di bank 🏦")';
    } else if (level <= 4) {
      visualStyle = 'Gunakan emoji 1-2 secukupnya, sertakan analogi visual jika membantu pemahaman (misal: diagram verbal, flow description)';
    } else {
      visualStyle = 'Minimal emoji (0-1), fokus ke diagram verbal atau ilustrasi konseptual jika diperlukan untuk clarity';
    }
  } else {
    if (level <= 2) {
      visualStyle = 'Minimal emoji (1 untuk tone saja), fokus ke struktur teks yang sangat jelas dan logical';
    } else {
      visualStyle = 'Hindari emoji, gunakan numbering/bullet points untuk struktur, fokus pada logika dan reasoning';
    }
  }
  
  const closingStyle = tempo === 'I'
    ? 'Akhiri dengan 1 pertanyaan pemandu singkat dan to-the-point'
    : 'Akhiri dengan pertanyaan yang mengundang refleksi lebih dalam dan critical thinking';
  
  const enthusiasmLevel = level <= 2 
    ? 'Very High (celebratory & encouraging)' 
    : level <= 4 
    ? 'Moderate (positive but measured)' 
    : 'Professional (acknowledging but not overly celebratory)';
  
  let praiseStyle: string;
  if (level <= 2) {
    praiseStyle = tempo === 'I' ? '🎉 LUAR BIASA! / SEMPURNA!' : '🎉 Sempurna! Kamu hebat! Excellent understanding!';
  } else if (level <= 4) {
    praiseStyle = tempo === 'I' ? '✅ Bagus! / Benar!' : '✅ Excellent work! Pemahaman kamu solid!';
  } else {
    praiseStyle = tempo === 'I' ? 'Correct.' : 'Well done. Your reasoning is sound.';
  }
  
  const explanationDepth = level <= 2 
    ? 'Basic: Fokus ke "kenapa benar" dengan bahasa sangat sederhana, reinforce understanding dasar'
    : level <= 4
    ? 'Moderate: Jelaskan reasoning dengan insight tambahan, connect to broader concepts'
    : 'Detailed: Explain reasoning comprehensively, mention edge cases, optimizations, atau advanced connections';
  
  const walkthroughApproach = processing === 'G'
    ? 'Global-to-Detail: Mulai dari konsep/prinsip besar → Overview solusi → Breakdown detail → Kesimpulan'
    : 'Step-by-Step Analytic: Langkah 1 → Langkah 2 → ... → Hasil Akhir (trace execution)';
  
  const walkthroughStructure = processing === 'G'
    ? (tempo === 'I'
        ? '1. 🎯 Konsep Kunci (1-2 kalimat) | 2. 📋 Overview Solusi | 3. ✅ Kesimpulan'
        : '1. 🎯 Konsep Kunci | 2. 📋 Overview Solusi | 3. 🔢 Breakdown Detail | 4. ✅ Kesimpulan + mention opsi lain')
    : (tempo === 'I'
        ? 'Langkah 1 → 2 → 3 → Hasil (concise, no elaboration)'
        : 'Langkah 1 (dengan reasoning) → 2 (dengan reasoning) → ... → Hasil (explain each step)');
  
  const startingPoint = processing === 'G' 
    ? 'Mulai dari konsep/prinsip besar yang mendasari soal, baru breakdown ke langkah-langkah konkret'
    : 'Mulai dari langkah pertama eksekusi, trace step-by-step sampai hasil akhir';
  
  const detailLevel = tempo === 'I' 
    ? 'Overview (concise, high-level explanation)' 
    : level <= 3 
    ? 'Moderate (balance antara overview dan detail)' 
    : 'Comprehensive (detailed explanation dengan reasoning setiap langkah)';
  
  return {
    correctiveFeedback: {
      maxWords: correctiveWords,
      tone,
      openingPhrase,
      hintProgression,
      structure,
      visualStyle,
      closingStyle
    },
    positiveReinforcement: {
      maxWords: positiveWords,
      enthusiasmLevel,
      praiseStyle,
      explanationDepth
    },
    detailedWalkthrough: {
      maxWords: walkthroughWords,
      approach: walkthroughApproach,
      structure: walkthroughStructure,
      startingPoint,
      detailLevel,
      visualStyle
    }
  };
}

export function getAIStrategy(profileCode: string): AIStrategy {
  const params = parseProfileCode(profileCode);
  return deriveAIStrategy(params);
}

export function getProfileDescription(profileCode: string): string {
  const params = parseProfileCode(profileCode);
  const { level, visual, processing, tempo } = params;
  
  const levelDesc = ['', 'Pemula', 'Pemula-Menengah', 'Menengah', 'Menengah-Lanjut', 'Lanjut', 'Expert'][level] || 'Menengah';
  const visualDesc = visual === 'T' ? 'text-based (logical, conceptual)' : 'visual-based (analogies, diagrams)';
  const processingDesc = processing === 'G' ? 'global (big picture first, top-down)' : 'analytic (step-by-step detail, bottom-up)';
  const tempoDesc = tempo === 'I' ? 'impulsif (respons cepat, concise)' : 'reflektif (pemikiran mendalam, elaborate)';
  
  return `${levelDesc}, preferensi ${visualDesc}, pemrosesan ${processingDesc}, tempo ${tempoDesc}.`;
}

export function getAllProfileCodes(): string[] {
  const codes: string[] = [];
  for (let level = 1; level <= 6; level++) {
    for (const visual of ['T', 'P']) {
      for (const processing of ['G', 'A']) {
        for (const tempo of ['I', 'R']) {
          codes.push(`${level}${visual}${processing}${tempo}`);
        }
      }
    }
  }
  return codes;
}

export function isValidProfileCode(code: string): boolean {
  if (!code || code.length !== 4) return false;
  
  const level = parseInt(code[0]);
  const visual = code[1].toUpperCase();
  const processing = code[2].toUpperCase();
  const tempo = code[3].toUpperCase();
  
  return (
    level >= 1 && level <= 6 &&
    (visual === 'T' || visual === 'P') &&
    (processing === 'G' || processing === 'A') &&
    (tempo === 'I' || tempo === 'R')
  );
}