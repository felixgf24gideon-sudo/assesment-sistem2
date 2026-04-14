// server/src/config/profileSystem.ts

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

// ===== PERSONALIZED OPENING PHRASE GENERATOR =====
/**
 * Generate opening phrase berdasarkan FULL profile, bukan hardcoded
 * 
 * Dimensi:
 * - Level: Determines support level & complexity
 * - Visual: Determines use of analogies vs logic
 * - Processing: Determines big-picture vs step-by-step
 * - Tempo: Determines brevity vs elaboration
 */
function generateOpeningPhrase(
  level: number,
  visual: 'T' | 'P',
  processing: 'G' | 'A',
  tempo: 'I' | 'R'
): string {
  
  // ===== SUPPORT LEVEL (based on level & tempo) =====
  const supportLevel = level <= 2 ? 'very_high' : level <= 3 ? 'high' : 'moderate';
  
  // ===== ACKNOWLEDGE THEIR COGNITIVE STYLE =====
  // This is the KEY to personalization!
  
  let acknowledgment = '';
  
  // 1. Acknowledge their VISUAL style
  if (visual === 'P') {
    // Visual/Analogy learners
    if (level <= 2) {
      acknowledgment += 'Saya lihat kamu mencoba membayangkan solusinya.';
    } else if (level <= 4) {
      acknowledgment += 'Analogi yang kamu gunakan cukup dekat.';
    } else {
      acknowledgment += 'Your conceptual approach is sound.';
    }
  } else {
    // Text/Logic learners
    if (level <= 2) {
      acknowledgment += 'Saya lihat logika kamu sedang berjalan.';
    } else if (level <= 4) {
      acknowledgment += 'Reasoning mu mulai ada di jalur yang tepat.';
    } else {
      acknowledgment += 'Your logical framework is solid.';
    }
  }
  
  // 2. Acknowledge their PROCESSING style
  if (processing === 'G') {
    // Global learners - they see big picture
    if (level <= 2) {
      acknowledgment += ' Kamu sudah tangkap konsep besarnya!';
    } else if (level <= 4) {
      acknowledgment += ' Pemahaman konsep-mu baik.';
    } else {
      acknowledgment += ' Your conceptual grasp is strong.';
    }
  } else {
    // Analytic learners - they work step-by-step
    if (level <= 2) {
      acknowledgment += ' Langkah-langkahmu terstruktur dengan baik!';
    } else if (level <= 4) {
      acknowledgment += ' Urutan pemikiran-mu logis.';
    } else {
      acknowledgment += ' Your procedural logic is correct.';
    }
  }
  
  // 3. Add personalized correction based on TEMPO
  let correction = '';
  
  if (tempo === 'I') {
    // Impulsive: brief, direct, acknowledgment-focused
    if (supportLevel === 'very_high') {
      correction = ' Tapi ada yang kurang tepat di sini.';
    } else if (supportLevel === 'high') {
      correction = ' Perlu adjustment di satu area.';
    } else {
      correction = ' Reconsider this part.';
    }
  } else {
    // Reflective: elaborate, supportive, invitation to reflect
    if (supportLevel === 'very_high') {
      correction = ' Mari kita lihat bersama di mana yang perlu diperbaiki dan kenapa.';
    } else if (supportLevel === 'high') {
      correction = ' Ada satu area yang perlu ditelaah lebih dalam untuk keakuratan.';
    } else {
      correction = ' Let\'s examine this particular aspect more carefully.';
    }
  }
  
  return acknowledgment + correction;
}

// ===== PERSONALIZED CLOSING STYLE GENERATOR =====
/**
 * Generate closing berdasarkan profil, bukan generic
 */
function generateClosingStyle(
  level: number,
  visual: 'T' | 'P',
  processing: 'G' | 'A',
  tempo: 'I' | 'R'
): string {
  
  const supportLevel = level <= 2 ? 'very_high' : level <= 3 ? 'high' : 'moderate';
  
  // ===== FOR IMPULSIVE LEARNERS =====
  if (tempo === 'I') {
    if (supportLevel === 'very_high') {
      return 'Coba lagi sekarang! Kamu pasti bisa! 💪';
    } else if (supportLevel === 'high') {
      if (processing === 'G') {
        return 'Coba dengan insight konsep ini. Kamu siap!';
      } else {
        return 'Trace lagi step-nya. Mantap!';
      }
    } else {
      if (visual === 'P') {
        return 'Reconsider with this perspective.';
      } else {
        return 'Retry with this logic in mind.';
      }
    }
  }
  
  // ===== FOR REFLECTIVE LEARNERS =====
  else {
    if (supportLevel === 'very_high') {
      if (processing === 'G') {
        return 'Pikirkan hubungan antara konsep besar ini dengan jawaban mu. Kamu akan menemukan jawabannya! 💡';
      } else {
        return 'Perhatikan di mana alur langkah-langkahnya terputus. Aku percaya kamu bisa menemukan jawabannya! 💡';
      }
    } else if (supportLevel === 'high') {
      if (processing === 'G') {
        return 'Dengan pemahaman konsep ini, bagaimana kamu melihat masalahnya kembali?';
      } else {
        return 'Trace step-by-step lagi dengan fokus pada area yang kami diskusikan.';
      }
    } else {
      if (visual === 'P') {
        return 'Consider the conceptual framework we discussed. How does it apply here?';
      } else {
        return 'Analyze the logical chain once more with this understanding.';
      }
    }
  }
}

export function deriveAIStrategy(params: ProfileParams): AIStrategy {
  const { level, visual, processing, tempo } = params;
  
  const baseCorrectiveWords = tempo === 'I' ? 40 : 80;
  const levelMultiplier = 1 + ((level - 1) * 0.08);
  
  const correctiveWords = Math.round(baseCorrectiveWords * levelMultiplier);
  const positiveWords = Math.round(correctiveWords * 1.6);
  const walkthroughWords = Math.round(correctiveWords * (tempo === 'I' ? 2.5 : 3.5));
  
  // ===== TONE (based on level) =====
  let tone: string;
  if (level <= 2) {
    tone = 'Sangat supportif, ramah, gunakan bahasa sehari-hari yang sangat sederhana. Hindari istilah teknis.';
  } else if (level <= 4) {
    tone = 'Supportif dan edukatif, gunakan bahasa menengah dengan penjelasan istilah teknis yang memadai.';
  } else {
    tone = 'Sangat akademis, profesional, dan analitis tingkat tinggi. Gunakan terminologi teknis yang advance tanpa menjelaskan definisi dasar. Asumsikan siswa adalah seorang ahli (expert).';
  }
  
  // ===== OPENING PHRASE (PERSONALIZED) =====
  const openingPhrase = generateOpeningPhrase(level, visual, processing, tempo);
  
  // ===== HINT PROGRESSION =====
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
  
  // ===== CLOSING STYLE (PERSONALIZED) =====
  const closingStyle = generateClosingStyle(level, visual, processing, tempo);
  
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
        ? '1.  Konsep Kunci (1-2 kalimat) | 2.  Overview Solusi | 3.  Kesimpulan'
        : '1.  Konsep Kunci | 2.  Overview Solusi | 3.  Breakdown Detail | 4.  Kesimpulan + mention opsi lain')
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