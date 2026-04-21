// client/src/types/research.ts

// ===== RESEARCH SESSION =====
export interface ResearchSession {
  id: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'completed';
}

// ===== PROFILE ASSESSMENT =====
export interface ProfileAssessmentAnswer {
  [key: string]: string | number;  // Jawaban untuk setiap pertanyaan
}

export interface ProfileAssessment {
  id: string;
  session_id: string;
  assessment_answers: ProfileAssessmentAnswer;
  profile_code: string;  // Contoh: "3TPR"
  profile_description: string;
  created_at: string;
}

// ===== QUIZ RESPONSE =====
export interface QuizResponse {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  user_answer: string;
  is_correct: boolean;
  ai_feedback: string;
  feedback_profile_code: string;
  attempt_count: number;
  created_at: string;
}

// ===== EVALUATION =====
export interface Evaluation {
  id: string;
  session_id: string;
  question_number: number;
  feedback_relevance: number;  // 1-5
  feedback_clarity: number;    // 1-5
  feedback_helpfulness: number; // 1-5
  additional_comments: string;
  created_at: string;
}

// ===== RESEARCH STATE =====
export interface ResearchState {
  sessionId: string | null;
  currentStep: 1 | 2 | 3;  // Step 1: Profile Assessment, Step 2: Quiz, Step 3: Evaluation
  profileAssessment: ProfileAssessment | null;
  quizResponses: QuizResponse[];
  evaluations: Evaluation[];
  isLoading: boolean;
  error: string | null;
  syncStatus: 'synced' | 'pending' | 'error';
}