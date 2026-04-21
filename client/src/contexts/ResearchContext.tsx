// client/src/contexts/ResearchContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabase';
import { ResearchState, QuizResponse, Evaluation } from '../types/research';

// ===== STORAGE KEYS =====
const STORAGE_KEYS = {
  SESSION_ID: 'research_session_id',
  CURRENT_STEP: 'research_current_step',
  PROFILE_ASSESSMENT: 'research_profile_assessment',
  SYNC_STATUS: 'research_sync_status'
};

// ===== CONTEXT TYPE =====
interface ResearchContextType extends ResearchState {
  createSession: () => Promise<void>;
  saveProfileAssessment: (answers: any, profileCode: string, description: string) => Promise<void>;
  saveQuizResponse: (response: Omit<QuizResponse, 'id' | 'created_at' | 'session_id'>) => Promise<void>;
  saveEvaluation: (evaluation: Omit<Evaluation, 'id' | 'created_at' | 'session_id'>) => Promise<void>;
  goToStep: (step: 1 | 2 | 3) => void;
  resetSession: () => void;
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined);

// ===== PROVIDER =====
export function ResearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResearchState>({
    sessionId: null,
    currentStep: 1,
    profileAssessment: null,
    quizResponses: [],
    evaluations: [],
    isLoading: true,
    error: null,
    syncStatus: 'pending'
  });

  // ===== INITIALIZATION =====
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // 1. Check LocalStorage first (fast)
      const localSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
      
      if (localSessionId) {
        // 2. Verify session exists di Supabase
        const { data: sessionData, error } = await supabase
          .from('research_sessions')
          .select('*')
          .eq('session_id', localSessionId)
          .single();

        if (sessionData && !error) {
          // ✅ Session exists - recover it
          console.log('✅ Session recovered:', localSessionId);
          setState(prev => ({
            ...prev,
            sessionId: localSessionId,
            currentStep: (parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_STEP) || '1')) as 1 | 2 | 3,
            isLoading: false
          }));
          return;
        }
      }

      // 3. Session tidak ada atau invalid - buat baru
      await createNewSession();
    } catch (err) {
      console.error('❌ Initialization failed:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize session'
      }));
    }
  };

  const createNewSession = async () => {
    try {
      // Generate unique session ID
      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Insert ke Supabase
      const { error } = await supabase
        .from('research_sessions')
        .insert([{
          session_id: newSessionId,
          status: 'draft'
        }]);

      if (error) throw error;

      // Save to LocalStorage
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
      localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, '1');

      console.log('🆕 New session created:', newSessionId);

      setState(prev => ({
        ...prev,
        sessionId: newSessionId,
        currentStep: 1,
        isLoading: false
      }));
    } catch (err) {
      console.error('❌ Failed to create session:', err);
      throw err;
    }
  };

  // ===== SAVE PROFILE ASSESSMENT =====
  const saveProfileAssessment = async (
    answers: any,
    profileCode: string,
    description: string
  ) => {
    if (!state.sessionId) throw new Error('No active session');

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Save to LocalStorage immediately
      localStorage.setItem(STORAGE_KEYS.PROFILE_ASSESSMENT, JSON.stringify({
        answers,
        profileCode,
        description,
        timestamp: Date.now()
      }));
      localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, 'pending');

      // Sync to Supabase
      const { error } = await supabase
        .from('profile_assessments')
        .upsert({
          session_id: state.sessionId,
          assessment_answers: answers,
          profile_code: profileCode,
          profile_description: description
        });

      if (error) throw error;

      console.log('✅ Profile assessment saved');
      localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, 'synced');

      setState(prev => ({
        ...prev,
        profileAssessment: {
          id: '', // Will be set from DB
          session_id: state.sessionId!,
          assessment_answers: answers,
          profile_code: profileCode,
          profile_description: description,
          created_at: new Date().toISOString()
        },
        isLoading: false,
        syncStatus: 'synced'
      }));
    } catch (err: any) {
      console.error('❌ Failed to save profile assessment:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message,
        syncStatus: 'error'
      }));
      throw err;
    }
  };

  // ===== SAVE QUIZ RESPONSE =====
  const saveQuizResponse = async (
    response: Omit<QuizResponse, 'id' | 'created_at' | 'session_id'>
  ) => {
    if (!state.sessionId) throw new Error('No active session');

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Insert to Supabase
      const { error } = await supabase
        .from('quiz_responses')
        .insert([{
          session_id: state.sessionId,
          ...response
        }]);

      if (error) throw error;

      console.log('✅ Quiz response saved for question', response.question_number);

      setState(prev => ({
        ...prev,
        quizResponses: [...prev.quizResponses, { ...response, id: '', created_at: '', session_id: state.sessionId! }],
        isLoading: false
      }));
    } catch (err: any) {
      console.error('❌ Failed to save quiz response:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message
      }));
      throw err;
    }
  };

  // ===== SAVE EVALUATION =====
  const saveEvaluation = async (
    evaluation: Omit<Evaluation, 'id' | 'created_at' | 'session_id'>
  ) => {
    if (!state.sessionId) throw new Error('No active session');

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Insert to Supabase
      const { error } = await supabase
        .from('evaluations')
        .insert([{
          session_id: state.sessionId,
          ...evaluation
        }]);

      if (error) throw error;

      console.log('✅ Evaluation saved for question', evaluation.question_number);

      setState(prev => ({
        ...prev,
        evaluations: [...prev.evaluations, { ...evaluation, id: '', created_at: '', session_id: state.sessionId! }],
        isLoading: false
      }));
    } catch (err: any) {
      console.error('❌ Failed to save evaluation:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message
      }));
      throw err;
    }
  };

  // ===== GO TO STEP =====
  const goToStep = (step: 1 | 2 | 3) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, step.toString());
    setState(prev => ({
      ...prev,
      currentStep: step
    }));
  };

  // ===== RESET SESSION =====
  const resetSession = () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
    localStorage.removeItem(STORAGE_KEYS.PROFILE_ASSESSMENT);
    localStorage.removeItem(STORAGE_KEYS.SYNC_STATUS);
    setState({
      sessionId: null,
      currentStep: 1,
      profileAssessment: null,
      quizResponses: [],
      evaluations: [],
      isLoading: true,
      error: null,
      syncStatus: 'pending'
    });
  };

  return (
    <ResearchContext.Provider value={{
      ...state,
      createSession: createNewSession,
      saveProfileAssessment,
      saveQuizResponse,
      saveEvaluation,
      goToStep,
      resetSession
    }}>
      {children}
    </ResearchContext.Provider>
  );
}

// ===== CUSTOM HOOK =====
export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within ResearchProvider');
  }
  return context;
}