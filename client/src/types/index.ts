export * from '../../../shared/types';
import { StudentProfile } from '../../../shared/types';

export interface LearningState {
  profile: StudentProfile | null;
  currentQuestionIndex: number;
  attemptCount: number;
  correctnessState: 'neutral' | 'incorrect' | 'correct';
  selectedAnswer: number | null;
  aiFeedback: string;
  isLoading: boolean;
  sessionProgress: {
    totalQuestions: number;
    answeredCorrectly: number;
  };
}

export type LearningAction =
  | { type: 'SET_PROFILE'; payload: StudentProfile }
  | { type: 'SELECT_ANSWER'; payload: number | null }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'FEEDBACK_RECEIVED'; payload: { feedback: string; isCorrect: boolean } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESET_ATTEMPTS' };

export interface FeedbackResponse {
  feedback: string;
  isCorrect: boolean;
}
