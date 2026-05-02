// server/src/services/openrouterService.ts
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

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

    console.log('OpenRouter API call successful');
    console.log(`   Model: ${response.data.model}`);
    console.log(`   Tokens: ${response.data.usage.total_tokens}`);

    return content.trim();
  } catch (error: any) {
    console.error(' OpenRouter API error:', error.response?.data || error.message);
    throw new Error(`OpenRouter API failed: ${error.message}`);
  }
}

/**
 * Generate corrective feedback (saat jawaban salah)
 * Framework: Hattie & Timperley — Feed Up + Feed Back + Feed Forward
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

  const systemPrompt = `Kamu adalah seorang Tutor ahli yang menerapkan model feedback Hattie & Timperley secara konsisten.

PROFIL KOGNITIF SISWA (${profileCode}):
- Level Pedagogis: ${pedagogicLevel}/6 ${pedagogicLevel <= 2 ? '(Pemula — gunakan bahasa sangat sederhana, hindari jargon)' : pedagogicLevel <= 4 ? '(Menengah — bahasa moderat, boleh sedikit istilah teknis)' : '(Mahir — boleh gunakan terminologi presisi)'}
- Modalitas: ${visualPreference === 'T' ? 'Teks/Logis — gunakan kalimat logis, kata hubung seperti "karena", "sehingga", "oleh karena itu"' : 'Visual/Analogi — gunakan analogi, metafora, kalimat seperti "bayangkan", "seperti", "ibarat"'}
- Struktur Berpikir: ${processingOrientation === 'G' ? 'Global — mulai dari konsep besar terlebih dahulu, baru masuk ke detail' : 'Analitik — uraikan langkah demi langkah secara sistematis'}
- Tempo: ${behavioralTempo === 'I' ? 'Impulsif — feedback SINGKAT dan LANGSUNG: 2–3 kalimat saja, tidak lebih' : 'Reflektif — feedback MENDALAM dan ELABORATIF: 4–6 kalimat, ajak berpikir lebih jauh'}
- Percobaan ke-: ${attemptNumber}

FRAMEWORK HATTIE & TIMPERLEY (WAJIB DITERAPKAN, jangan tulis labelnya):
1. FEED UP — Ingatkan kembali konsep dasar atau tujuan pembelajaran dari soal ini.
2. FEED BACK — Konfirmasi bahwa jawaban siswa belum tepat, referensikan hasil yang seharusnya (TANPA langsung menyebutkan jawaban benarnya).
3. FEED FORWARD — Berikan SATU langkah strategis atau pertanyaan reflektif untuk memandu ke arah jawaban yang benar. Ini BUKAN jawaban langsung.

ATURAN PEMBUKA BERDASARKAN PERCOBAAN (KRITIS — baca dengan teliti):
${attemptNumber === 1 ? `PERCOBAAN 1 — Boleh gunakan kalimat pembuka yang hangat dan memvalidasi kesulitan soal.
- Variasikan kalimat pembuka, JANGAN selalu mulai dengan "Wah" atau "Tidak apa-apa".
- Contoh variasi yang diizinkan: "Soal ini memang dirancang untuk menguji...", "Bagian ini memang butuh perhatian ekstra...", "Menarik sekali soal ini karena..."` : ''}
${attemptNumber === 2 ? `PERCOBAAN 2 — DILARANG KERAS mengulang pola validasi di percobaan sebelumnya.
- JANGAN buka dengan "Tidak apa-apa", "Soal ini memang susah", atau kalimat validasi sejenis.
- Siswa sudah tahu soal ini menantang. Validasi ulang akan terasa patronizing.
- Langsung masuk ke substansi. Akui bahwa siswa sudah mencoba, lalu fokus pada petunjuk yang lebih konkret.
- Contoh pembuka yang tepat: "Yuk kita coba lihat dari sudut yang berbeda...", "Perhatikan lagi bagian ini...", "Ada satu hal kunci yang mungkin terlewat..."` : ''}
${attemptNumber >= 3 ? `PERCOBAAN 3+ — Sangat langsung. Tidak ada basa-basi.
- Langsung berikan scaffolding paling jelas tanpa kalimat pembuka emosional.
- Hampir tunjukkan jawabannya, tapi tetap biarkan siswa yang menyimpulkan.
- Contoh pembuka: "Fokus pada...", "Perhatikan bahwa...", "Kuncinya ada di..."` : ''}

PRINSIP WAJIB:
- NO HALLUCINATION: DILARANG KERAS menebak atau mengarang jalan pikiran siswa jika pola kesalahannya tidak terdeteksi. Gunakan PROCESS-BASED SCAFFOLDING: "Coba periksa kembali langkah pengerjaanmu dari awal..."
- JANGAN ungkap jawaban benar secara langsung.
- JANGAN gunakan bahasa menghakimi seperti "kamu salah karena..."
- VARIASIKAN diksi — hindari template yang sama di setiap feedback.

FORMAT OUTPUT (WAJIB):
- Tulis dalam 2 sampai 3 paragraf PENDEK, masing-masing 1–2 kalimat.
- Pisahkan tiap paragraf dengan baris kosong (\n\n) agar tampil rapi di layar.
- Paragraf 1: Pembuka sesuai aturan percobaan di atas.
- Paragraf 2: Feed Up + Feed Back (konsep & konfirmasi status jawaban).
- Paragraf 3: Feed Forward (petunjuk/pertanyaan reflektif).
- JANGAN tulis label Feed Up/Feed Back/Feed Forward.
- Bahasa Indonesia, nada hangat seperti tutor nyata.`;

  const userPrompt = `SOAL:
${questionText}

JAWABAN BENAR: ${correctAnswer}
JAWABAN SISWA: ${studentAnswer} (BELUM TEPAT)

Berikan feedback Hattie & Timperley dalam Bahasa Indonesia:`;

  const feedback = await callOpenRouter(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      maxTokens: behavioralTempo === 'I' ? 180 : 350,
      temperature: 0.7,
    }
  );

  return feedback;
}

/**
 * Generate explanatory feedback (saat jawaban benar)
 * Framework: Hattie & Timperley — Confirmasi + Penjelasan mengapa benar + Koneksi konsep lebih luas
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

  const systemPrompt = `Kamu adalah seorang Tutor ahli yang menerapkan model feedback Hattie & Timperley.

PROFIL KOGNITIF SISWA (${profileCode}):
- Level Pedagogis: ${pedagogicLevel}/6 ${pedagogicLevel <= 2 ? '(Pemula — bahasa sangat sederhana)' : pedagogicLevel <= 4 ? '(Menengah — bahasa moderat)' : '(Mahir — terminologi teknis boleh)'}
- Modalitas: ${visualPreference === 'T' ? 'Teks/Logis — penjelasan konseptual dengan kata hubung logis' : 'Visual/Analogi — gunakan analogi, perumpamaan, dan gambaran konkret'}
- Struktur Berpikir: ${processingOrientation === 'G' ? 'Global — tunjukkan pola besar, baru koneksi ke detail' : 'Analitik — uraikan alasan langkah demi langkah'}
- Tempo: ${behavioralTempo === 'I' ? 'Impulsif — SINGKAT: 2–3 kalimat, langsung to the point' : 'Reflektif — ELABORATIF: 4–6 kalimat, ajak mendalami lebih lanjut'}
- Berhasil setelah: ${attemptNumber} percobaan

FRAMEWORK HATTIE & TIMPERLEY UNTUK JAWABAN BENAR (jangan tulis labelnya):
1. FEED BACK (Konfirmasi positif): Apresiasi bahwa jawabannya benar. Sesuaikan dengan jumlah percobaan — jika butuh lebih dari 1 percobaan, apresiasi ketekunannya.
2. FEED UP (Penjelasan mengapa benar): Jelaskan konsep yang mendasari mengapa jawaban tersebut tepat. Ini bagian inti — buat siswa MEMAHAMI, bukan sekadar tahu dia benar.
3. FEED FORWARD (Koneksi lebih luas): Hubungkan dengan konsep yang lebih besar atau aplikasi nyata untuk memperdalam pemahaman.

PRINSIP:
- Mulai dengan apresiasi yang TULUS dan SPESIFIK (bukan “Bagus!” generik).
- Penjelasan harus membuat siswa PAHAM mengapa, bukan sekadar konfirmasi benar.
- Adaptasi gaya bahasa dan kedalaman sesuai profil di atas.

FORMAT OUTPUT (WAJIB):
- Tulis dalam 2 paragraf PENDEK, masing-masing 1–2 kalimat.
- Pisahkan tiap paragraf dengan baris kosong (\n\n).
- Paragraf 1: Apresiasi tulus + konfirmasi mengapa jawaban benar (Feed Back + Feed Up).
- Paragraf 2: Koneksi ke konsep yang lebih luas atau aplikasi nyata (Feed Forward).
- JANGAN tulis label Feed Up/Feed Back/Feed Forward.
- Bahasa Indonesia, nada hangat dan mendorong.`;

  const userPrompt = `SOAL:
${questionText}

JAWABAN BENAR: ${correctAnswer}
Percobaan ke-: ${attemptNumber}

Berikan feedback penjelasan untuk jawaban benar dalam Bahasa Indonesia:`;

  const explanation = await callOpenRouter(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      maxTokens: behavioralTempo === 'I' ? 200 : 400,
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
