# Repository Analysis: Adaptive Learning + Research Evaluation System

> **CRITICAL INSIGHT:** Ini bukan hanya "practice quiz" biasa. Ini adalah **HYBRID RESEARCH SYSTEM** yang menggabungkan:
> 1. **Adaptive Learning** (AI-powered personalized feedback)
> 2. **Research Evaluation** (rubrik penilaian terhadap KUALITAS feedback)

---

## 🎯 Arsitektur Sistem yang SEBENARNYA

### **Fase 1: PROFILING**
```typescript
// ProfilingPage.tsx
// Mengumpulkan cognitive style setiap student
CognitiveStyle {
  visualPreference: 'T' | 'P'        // Text vs Pictures
  processingOrientation: 'G' | 'A'   // Global vs Analytic  
  behavioralTempo: 'I' | 'R'         // Impulsive vs Reflective
}
// Generates: Profile Code (e.g., "L3_T_G_R" = Level 3, Text, Global, Reflective)
```

### **Fase 2: QUIZ (Adaptive Assessment)**
```typescript
// QuizPage.tsx - LINE 68-82
async function initializeQuiz() {
  // FETCH QUESTIONS dari SUPABASE (bukan dari shared/questions.ts!)
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .order('id');
  
  // Data structure dari Supabase:
  interface Question {
    id: string;
    text: string;
    options: string[] | string;      // Array atau JSON string
    correct_answer: number;           // Index of correct option
    difficulty: number;               // 1-4
    topic: string;
    cognitive_tag?: string;           // For adaptive selection
    is_active: boolean;               // Toggle questions on/off
  }
}
```

**Quiz Flow:**
1. Load ALL active questions dari Supabase (Line 79-81)
2. Pilih random unanswered question (Line 112-114)
3. Max 8 questions per session (Line 51)
4. Submit answer → AI feedback via OpenRouter (Line 155-168)

**Key Insight:** 
- Soal TIDAK hardcoded di `shared/questions.ts`
- Soal di-fetch dari SUPABASE database
- Ini memungkinkan **dynamic question management** (tambah/kurangi/update soal tanpa redeploy)

### **Fase 3: EVALUATION RUBRIC (Research Data Collection)**
```typescript
// EvaluationPage.tsx - LINE 14-80
// PENILAIAN RUBRIK terhadap KUALITAS FEEDBACK dari AI

const RATING_DIMENSIONS = [
  {
    key: 'accuracy_positive',
    section: 'Akurasi Penjelasan',
    question: 'AI berhasil mendeteksi letak kesalahan saya dengan sangat tepat.',
  },
  {
    key: 'accuracy_negative',
    section: 'Akurasi Penjelasan',
    question: 'Saya merasa koreksi yang diberikan AI tidak sesuai dengan kesalahan yang saya buat.',
  },
  {
    key: 'clarity_positive',
    section: 'Kejelasan Bahasa',
    question: 'Penjelasan yang diberikan AI sangat mudah dipahami dalam sekali baca.',
  },
  // ... lebih banyak dimensions
];

// Likert Scale: 1-5
const LIKERT_SCALE = [
  { value: 1, label: 'Sangat Tidak Setuju' },
  { value: 2, label: 'Tidak Setuju' },
  { value: 3, label: 'Netral' },
  { value: 4, label: 'Setuju' },
  { value: 5, label: 'Sangat Setuju' },
];
```

**Evaluation Dimensions:**
1. **Akurasi Penjelasan** (Accuracy) - 2 items
2. **Kejelasan Bahasa** (Clarity) - 2 items  
3. **Kesesuaian Gaya Belajar** (Personalization Fit) - 2 items
4. **Panjang Penjelasan** (Pacing/Tempo) - 2 items
5. **Dampak Belajar** (Empowerment) - 2 items
**Total: 10 Likert-scale items + Open-ended feedback**

---

## 📊 Complete Data Flow

```
STUDENT ─────────────────────────────────────────────────────────→

1. PROFILING PAGE
   └─→ Select cognitive style dimensions
       └─→ Generate Profile Code (L1-6_T/P_G/A_I/R)
           └─→ Stored in SurveyContext
               └─→ Pass to next phase

2. QUIZ PAGE  
   ├─→ Fetch questions from SUPABASE
   │   └─→ Filter: is_active = true
   │       └─→ Load N questions (max 8)
   │
   ├─→ For each question:
   │   ├─→ Pick random unanswered question
   │   ├─→ Display question + 4-5 options
   │   ├─→ Student selects answer
   │   │
   │   └─→ Submit to backend
   │       │
   │       └─→ POST /api/feedback
   │           ├─ Body: {questionText, correctAnswer, studentAnswer, ...}
   │           │
   │           └─→ openrouterService.ts
   │               ├─→ Call OpenRouter API (DeepSeek R1)
   │               ├─→ Generate adaptive feedback based on:
   │               │   ├─ Is answer correct or incorrect?
   │               │   ├─ Attempt number (1-3)
   │               │   ├─ Student's cognitive profile
   │               │   └─ Difficulty level
   │               │
   │               └─→ Return personalized feedback
   │
   │   └─→ Display feedback
   │       └─→ Record response in SurveyContext:
   │           {
   │             question_id,
   │             question_text,
   │             selected_answer,
   │             correct_answer,
   │             feedback,
   │             is_correct,
   │             timestamp
   │           }

3. EVALUATION PAGE (Rubrik Penilaian)
   ├─→ For each answered question:
   │   ├─→ Show question + student answer + AI feedback
   │   │
   │   └─→ Present 10 rating dimensions:
   │       ├─→ Accuracy (2 items - positive & negative)
   │       ├─→ Clarity (2 items)
   │       ├─→ Personalization (2 items)
   │       ├─→ Pacing (2 items)
   │       └─→ Empowerment (2 items)
   │
   │   └─→ Student rates each on Likert 1-5
   │       └─→ Store ratings for this question
   │
   │   └─→ Open-ended feedback (optional)

4. THANK YOU PAGE
   └─→ Survey complete
       └─→ Data saved (questionsAnswered + ratings)

════════════════════════════════════════════════════════════════

DATA COLLECTED (for research):
├─ Student Profile Code (cognitive style)
├─ Quiz Responses (8 questions max)
│  ├─ Question ID
│  ├─ Student answer
│  ├─ Correct answer
│  ├─ AI feedback received
│  └─ Correctness
├─ Evaluation Ratings (10 dimensions per question)
│  ├─ Accuracy of explanation
│  ├─ Clarity of language
│  ├─ Fit to learning style
│  ├─ Appropriate length
│  ├─ Learning impact
│  └─ Open-ended feedback
└─ Timestamps
```

---

## 🔌 Data Source Architecture

### **Questions: SUPABASE DATABASE**
```
NOT from shared/questions.ts (that's fallback/legacy)

SUPABASE Table: "questions"
├─ Columns:
│  ├─ id (primary key)
│  ├─ text (question text)
│  ├─ options (JSON array of choices)
│  ├─ correct_answer (index: 0-4)
│  ├─ difficulty (1-4)
│  ├─ topic (string)
│  ├─ cognitive_tag (optional - for adaptive selection)
│  └─ is_active (boolean - to enable/disable questions)

Data Fetching (QuizPage.tsx Line 68-72):
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)  ← Filter only active questions
    .order('id');

This allows:
✅ Add/remove questions without code changes
✅ A/B test different question sets
✅ Disable problematic questions
✅ Manage large question banks
```

### **Feedback: OpenRouter API**
```
Student Answer → Backend Controller → openrouterService.ts

callOpenRouter(messages, options)
├─ AI Model: deepseek/deepseek-r1 (from .env)
├─ Temperature: 0.7
├─ Max Tokens: 150-250
└─ System Prompt: Adaptive based on student profile

Generates TWO types of feedback:
1. generateCorrectiveFeedback() - when answer is WRONG
   └─ Adaptive hints (Attempt 1-3 escalation)

2. generateExplanation() - when answer is CORRECT
   └─ Congratulatory explanation + why correct
```

### **Evaluation Data: SurveyContext State**
```
// client/src/contexts/SurveyContext.tsx (likely implementation)

State Structure (inferred from usage):
{
  profileCode: "L3_T_G_R",
  questionsAnswered: [
    {
      question_id: "q1",
      question_text: "...",
      selected_answer: 1,
      correct_answer: 1,
      feedback: "...",
      is_correct: true,
      timestamp: Date
    },
    // ... 8 questions max
  ],
  evaluations: [
    {
      question_id: "q1",
      ratings: {
        accuracy_positive: 4,
        accuracy_negative: 2,
        clarity_positive: 5,
        clarity_negative: 1,
        // ... all 10 dimensions
      },
      open_feedback: "..."
    },
    // ... for each question
  ]
}
```

---

## 🧪 Research Study Design Hypothesis

Based on the rubric structure, this appears to be evaluating:

**"How well does AI-personalized feedback (based on cognitive styles) match student learning preferences?"**

**Variables:**
- **Independent:** Cognitive style profile (3 dimensions)
- **Dependent:** Perceived feedback quality (10 dimensions rated on Likert scale)

**Research Question:**
```
Does adapting AI feedback to student cognitive profiles 
improve perceived:
  1. Accuracy of explanation
  2. Clarity of language
  3. Fit to learning style
  4. Appropriate pacing
  5. Learning impact
  
...compared to generic feedback?
```

---

## ⚠️ Critical Implementation Issues (Updated)

### **CRITICAL: Supabase Integration Not Fully Implemented**
```
Status: 🔴 CRITICAL
File: server/src/ (NO Supabase service layer)
Issue: Backend doesn't fetch/validate questions from Supabase
```

**Current State:**
- Client fetches questions directly from Supabase (QuizPage.tsx Line 68)
- Server has NO verification that questions are valid
- Server doesn't track which questions were shown
- **Security Risk:** Client could manipulate `is_active` flag

**Fix Needed:**
```typescript
// server/src/services/supabaseService.ts (MISSING)
export async function getActiveQuestions() {
  const supabase = createClient(url, key); // Server-side client
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true);
    
  if (error) throw error;
  return data;
}

export async function validateAnswer(questionId: string, selectedIndex: number) {
  const { data } = await supabase
    .from('questions')
    .select('correct_answer')
    .eq('id', questionId)
    .single();
    
  return data.correct_answer === selectedIndex;
}
```

### **CRITICAL: Missing SurveyContext Implementation**
```
Status: 🔴 CRITICAL
File: client/src/contexts/SurveyContext.tsx
Issue: Context is imported but NOT FOUND in repo
```

**Used in:** App.tsx, QuizPage.tsx, EvaluationPage.tsx, etc.

```typescript
// client/src/contexts/SurveyContext.tsx (MUST CREATE)
import { createContext, useContext, useState } from 'react';

interface QuizResponse {
  question_id: string;
  question_text: string;
  selected_answer: number;
  correct_answer: number;
  correct_answer_text: string;
  feedback: string;
  is_correct: boolean;
  timestamp: Date;
}

interface EvaluationRating {
  question_id: string;
  ratings: Record<string, number>; // 10 dimensions
  open_feedback: string;
}

interface SurveyContextType {
  currentPage: 'profiling' | 'quiz' | 'evaluation' | 'thank-you';
  profileCode: string;
  questionsAnswered: QuizResponse[];
  evaluations: EvaluationRating[];
  
  setProfileCode: (code: string) => void;
  addQuizResponse: (response: QuizResponse) => void;
  addEvaluation: (eval: EvaluationRating) => void;
  completeQuiz: () => void;
  completeSurvey: () => Promise<void>;
}

const SurveyContext = createContext<SurveyContextType | null>(null);

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<'profiling' | 'quiz' | 'evaluation' | 'thank-you'>('profiling');
  const [profileCode, setProfileCode] = useState('');
  const [questionsAnswered, setQuestionsAnswered] = useState<QuizResponse[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRating[]>([]);

  const addQuizResponse = (response: QuizResponse) => {
    setQuestionsAnswered(prev => [...prev, response]);
  };

  const addEvaluation = (eval: EvaluationRating) => {
    setEvaluations(prev => [...prev, eval]);
  };

  const completeQuiz = () => {
    setCurrentPage('evaluation');
  };

  const completeSurvey = async () => {
    // Save all data somewhere (Supabase, backend, etc.)
    try {
      const response = await fetch('/api/survey/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileCode,
          questionsAnswered,
          evaluations,
          timestamp: new Date(),
        }),
      });
      if (!response.ok) throw new Error('Failed to save survey');
      setCurrentPage('thank-you');
    } catch (error) {
      console.error('Error completing survey:', error);
      throw error;
    }
  };

  return (
    <SurveyContext.Provider value={{
      currentPage,
      profileCode,
      questionsAnswered,
      evaluations,
      setProfileCode,
      addQuizResponse,
      addEvaluation,
      completeQuiz,
      completeSurvey,
    }}>
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (!context) throw new Error('useSurvey must be used within SurveyProvider');
  return context;
}
```

### **HIGH: Survey Completion Endpoint Missing**
```
Status: 🟡 HIGH
Endpoint: POST /api/survey/complete
Issue: Not implemented in server
```

**Needed:**
```typescript
// server/src/controllers/surveyController.ts
export async function completeSurvey(req: Request, res: Response) {
  const { profileCode, questionsAnswered, evaluations } = req.body;
  
  // Save to database (Supabase or other)
  // Log for research analysis
  // Return success
}
```

### **HIGH: No Fallback Question Source**
```
Status: 🟡 HIGH
Issue: If Supabase fetch fails, system breaks
```

**shared/questions.ts exists but is NOT USED**
- This should be fallback for when Supabase is unavailable

---

## 📈 Data Analytics Opportunities

The rubric collects data for analyzing:

```
1. ACCURACY DIMENSION
   • Do adaptive profiles improve error detection accuracy?
   • Which cognitive styles have highest accuracy satisfaction?

2. CLARITY DIMENSION
   • Which pedagogical levels prefer which explanation styles?
   • Text vs Picture learners: clarity differences?

3. PERSONALIZATION FIT
   • Does matching cognitive style to feedback improve perception?
   • Which dimension combinations work best?

4. PACING DIMENSION
   • Do reflective (R) learners prefer longer explanations?
   • Do impulsive (I) learners prefer concise feedback?

5. EMPOWERMENT DIMENSION
   • Which profiles show highest learning confidence post-feedback?
   • Correlation between engagement and perceived learning?

═══════════════════════════════════════════════════════════

RESEARCH OUTCOME:
├─ Dataset: 10 Likert scales × 8 questions × N students
├─ Analysis: ANOVA/Regression on cognitive style factors
├─ Publication: "Adaptive Feedback and Cognitive Styles in Online Learning"
└─ Contribution: Evidence for personalization in EdTech AI
```

---

## 🔄 Evolution of the System

```
TIMELINE RECONSTRUCTION:

Version 1 (Original - App.tsx.old)
├─ Auth system (Login/Register)
├─ User dashboard
├─ Persistent profiles in database
├─ Practice mode for learning
└─ LearningContext for state

                    ↓ REFACTORED ↓

Version 2 (Current - App.tsx)  
├─ Removed: Authentication
├─ Removed: Dashboard
├─ Removed: Persistent user storage
├─ Added: Linear survey flow
├─ Added: Evaluation rubric
├─ Changed Purpose: 
│  From: "Interactive learning platform for students"
│  To: "One-time research study on adaptive feedback"
└─ SurveyContext (replaces LearningContext + Auth)
```

**This is INTENTIONAL:** The system was converted from a **learning platform** to a **research evaluation tool**.

---

## ✅ Summary: What This System Actually Does

| Phase | Purpose | Data Source | Data Collected |
|-------|---------|-------------|-----------------|
| **Profiling** | Establish student cognitive profile | User input | 3-dim profile code |
| **Quiz** | Assess understanding + generate AI feedback | **SUPABASE** questions | Answer + feedback |
| **Evaluation** | Rate quality of AI feedback | Manual Likert ratings | 10 rubric dimensions |
| **Completion** | Compile research data | SurveyContext | Full dataset |

**Key Finding:** 
- ✅ Questions come from **SUPABASE** (dynamic, not hardcoded)
- ✅ Feedback from **OpenRouter API** (personalized AI)
- ✅ Rubric evaluation **IN-APP** (research data collection)
- ❌ Backend survey save endpoint MISSING
- ❌ SurveyContext NOT FOUND (implementation missing)
- ❌ Supabase service layer NOT FOUND (server-side)
