export interface CognitiveStyle {
  visualPreference: 'T' | 'P';      // Text or Pictures
  processingOrientation: 'G' | 'A'; // Global or Analytic
  behavioralTempo: 'I' | 'R';       // Impulsive or Reflective
}

export interface StudentProfile {
  pedagogicalLevel: 1 | 2 | 3 | 4 | 5 | 6;
  cognitiveStyle: CognitiveStyle;
  profileCode: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  difficulty: number;
}

export interface FeedbackRequest {
  profileCode: string;
  pedagogicalLevel: number;
  attemptNumber: number;
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  cognitiveStyle: CognitiveStyle;
}

export interface FeedbackResponse {
  feedback: string;
  isCorrect: boolean;
}
