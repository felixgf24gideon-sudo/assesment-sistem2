// client/src/types/survey.ts

export interface ProfileQuestion {
  id: string;
  dimension: 'level' | 'visual' | 'processing' | 'tempo';
  question: string;
  options: {
    text: string;
    value: number | 'T' | 'P' | 'G' | 'A' | 'I' | 'R';
  }[];
}

export interface QuizResponse {
  question_id: string;
  question_text: string;
  selected_answer: number;
  correct_answer: number;
  correct_answer_text: string;
  feedback: string;
  is_correct: boolean;
  timestamp: Date;
}

export interface EvaluationResponse {
  question_id: string;
  ratings: {
    accuracy_positive: number;
    accuracy_negative: number;
    clarity_positive: number;
    clarity_negative: number;
    personalization_positive: number;
    personalization_negative: number;
    pacing_positive: number;
    pacing_negative: number;
    empowerment_positive: number;
    empowerment_negative: number;
  };
  open_feedback: string;
}

export interface RespondentBiodata {
  nama: string;
  nim: string;
  jurusan: string;
  whatsapp: string;
  consentAcceptedAt?: string; // ISO timestamp
}

export interface SurveyState {
  profileCode: string | null;
  assessmentAnswers: Record<string, number | string>;
  questionsAnswered: QuizResponse[];
  evaluationResponses: EvaluationResponse[];
  sessionId: string;
  currentPage: 'profiling' | 'quiz' | 'evaluation' | 'thank-you';
  startedAt: Date;
  completedAt: Date | null;
  biodata?: RespondentBiodata;
}