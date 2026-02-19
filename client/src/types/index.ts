// client/src/types/index.ts

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  pedagogic_level: number;
  profile_code: string;
  visual_preference: 'T' | 'P';
  processing_orientation: 'G' | 'A';
  behavioral_tempo: 'I' | 'R';
  total_questions_attempted: number;
  total_questions_correct: number;
  created_at: string;
}

// Auth State
export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

// Login Credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Register Data
export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  profile_code: string;
}