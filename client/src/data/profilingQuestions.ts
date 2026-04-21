import { ProfileQuestion } from '../types/survey';

export const PROFILING_QUESTIONS: ProfileQuestion[] = [
  // =========================================
  // LEVEL (ZPD) — 1 Question (Direct 1–6)
  // Scientific grounding: Vygotsky ZPD
  // =========================================
  {
    id: 'level-1',
    dimension: 'level',
    question:
      'Seberapa familiar Anda dengan mata kuliah computational thinking/berpikir komputasional?',
    options: [
      { text: '1 — Saya benar-benar baru di bidang ini dan butuh bimbingan penuh dari awal sekali', value: 1 },
      { text: '2 — Saya pernah dengar istilahnya, tapi belum berani mencoba mengerjakan soal tanpa panduan detail.', value: 2 },
      { text: '3 — Saya paham konsep dasarnya, tapi masih sering butuh petunjuk kecil saat menemui soal yang agak rumit.', value: 3 },
      { text: '4 — Saya sudah bisa mengerjakan soal secara mandiri dan jarang memerlukan bantuan instruksi tambahan.', value: 4 },
      { text: '5 — Saya menguasai konsepnya dengan sangat baik, bahkan sering membantu teman yang kesulitan memahami materi.', value: 5 },
      { text: '6 — Saya mampu menganalisis berbagai strategi solusi dan menentukan cara mana yang paling efisien.', value: 6 },
    ],
  },

  // =========================================
  // MODALITY (T/P) — 2 Proxy Questions
  // Scientific grounding: Dunn & Dunn (Modality)
  // Scoring: A=+1, B=-1 → T if score>0 else P
  // =========================================
  {
    id: 'modality-1',
    dimension: 'visual',
    question:
      'Saya lebih suka rumus/definisi teknis (A) daripada analogi/cerita (B).',
    options: [
      { text: 'A — Saya lebih suka rumus/definisi teknis', value: 1 },
      { text: 'B — Saya lebih suka analogi/cerita untuk memahami konsep', value: -1 },
    ],
  },
  {
    id: 'modality-2',
    dimension: 'visual',
    question:
      'Fakta teknis dan detail langkah (A) lebih menarik bagi saya daripada ilustrasi konsep (B).',
    options: [
      { text: 'A — Fakta teknis/detail langkah lebih menarik', value: 1 },
      { text: 'B — Ilustrasi konsep/analogi lebih menarik', value: -1 },
    ],
  },

  // =========================================
  // PROCESSING (G/A) — 2 Proxy Questions
  // Scientific grounding: Dunn & Dunn (Global vs Analytic)
  // Scoring: A=+1, B=-1 → G if score>0 else A
  // =========================================
  {
    id: 'processing-1',
    dimension: 'processing',
    question:
      'Sampaikan kesimpulan besarnya dulu (A), baru detailnya (B).',
    options: [
      { text: 'A — Kesimpulan/gambaran besar dulu', value: 1 },
      { text: 'B — Detail/langkah-langkah dulu', value: -1 },
    ],
  },
  {
    id: 'processing-2',
    dimension: 'processing',
    question:
      'Saya lebih suka melihat “tujuan akhir” (A) daripada “langkah pertama” (B).',
    options: [
      { text: 'A — Tujuan akhir / hasil akhir dulu', value: 1 },
      { text: 'B — Langkah pertama / prosedur dulu', value: -1 },
    ],
  },

  // =========================================
  // TEMPO (I/R) — 2 Proxy Questions
  // Scientific grounding: Kagan Cognitive Tempo
  // Scoring: A=+1, B=-1 → I if score>0 else R
  // =========================================
  {
    id: 'tempo-1',
    dimension: 'tempo',
    question:
      'Feedback singkat itu lebih efektif (A) daripada penjelasan panjang (B).',
    options: [
      { text: 'A — Feedback singkat lebih efektif', value: 1 },
      { text: 'B — Penjelasan panjang lebih efektif', value: -1 },
    ],
  },
  {
    id: 'tempo-2',
    dimension: 'tempo',
    question:
      'Saya ingin tahu jawaban benar dengan cepat (A) daripada merenungkannya dulu (B).',
    options: [
      { text: 'A — Ingin cepat tahu jawaban benar', value: 1 },
      { text: 'B — Lebih suka merenung/menalar dulu', value: -1 },
    ],
  },
];

function clampLevel(n: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (n <= 1) return 1;
  if (n >= 6) return 6;
  return n as 1 | 2 | 3 | 4 | 5 | 6;
}

function sumAnswers(
  answers: Record<string, number | string>,
  ids: string[]
): number {
  return ids.reduce((sum, id) => {
    const v = answers[id];
    return sum + (typeof v === 'number' ? v : 0);
  }, 0);
}

export function calculateProfileCode(
  answers: Record<string, number | string>
): string {
  // =========================
  // A) LEVEL (ZPD) — Direct
  // =========================
  const rawLevel = typeof answers['level-1'] === 'number' ? (answers['level-1'] as number) : 3;
  const level = clampLevel(rawLevel);

  // =========================
  // B) STYLE DIMENSIONS — Proxy (+1/-1)
  // =========================
  // Modality (Text vs Picture) → use dimension 'visual' in app, but code is T/P
  const modalityScore = sumAnswers(answers, ['modality-1', 'modality-2']);
  const modality: 'T' | 'P' = modalityScore > 0 ? 'T' : 'P';

  // Processing (Global vs Analytic)
  const processingScore = sumAnswers(answers, ['processing-1', 'processing-2']);
  const processing: 'G' | 'A' = processingScore > 0 ? 'G' : 'A';

  // Tempo (Impulsive vs Reflective)
  const tempoScore = sumAnswers(answers, ['tempo-1', 'tempo-2']);
  const tempo: 'I' | 'R' = tempoScore > 0 ? 'I' : 'R';

  const profileCode = `${level}${modality}${processing}${tempo}`;

  // Research-friendly logging (optional)
  console.log('📊 Diagnostic scoring:');
  console.log(`   level(ZPD): ${level} (raw=${rawLevel})`);
  console.log(`   modality(T/P): ${modality} (score=${modalityScore})`);
  console.log(`   processing(G/A): ${processing} (score=${processingScore})`);
  console.log(`   tempo(I/R): ${tempo} (score=${tempoScore})`);
  console.log('✅ Calculated Profile:', profileCode);

  return profileCode;
}