// client/src/contexts/SurveyContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SurveyState, QuizResponse, EvaluationResponse, RespondentBiodata } from '../types/survey';
import { saveSurveyResults } from '../services/surveyService';

interface SurveyContextType extends SurveyState {
  setProfileCode: (code: string) => void;
  setAssessmentAnswers: (answers: Record<string, number | string>) => void;
  setBiodata: (biodata: RespondentBiodata) => void;
  addQuizResponse: (response: QuizResponse) => void;
  completeQuiz: () => void;
  addEvaluation: (evaluation: EvaluationResponse) => void;
  completeSurvey: () => Promise<void>;
  resetSurvey: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);
const STORAGE_KEY = 'survey_state_v1';

const getDefaultState = (): SurveyState => ({
  profileCode: null,
  assessmentAnswers: {},
  questionsAnswered: [],
  evaluationResponses: [],
  sessionId: uuidv4(),
  currentPage: 'profiling',
  startedAt: new Date(),
  completedAt: null,
  biodata: undefined,
});

const loadPersistedState = (): SurveyState | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      version: number;
      data: Omit<SurveyState, 'startedAt' | 'completedAt' | 'questionsAnswered'> & {
        startedAt: string;
        completedAt: string | null;
        questionsAnswered: Array<Omit<QuizResponse, 'timestamp'> & { timestamp: string }>;
      };
    };

    if (!parsed?.data) return null;

    return {
      ...parsed.data,
      startedAt: new Date(parsed.data.startedAt),
      completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : null,
      questionsAnswered: parsed.data.questionsAnswered.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })),
    };
  } catch (error) {
    console.warn('Failed to load persisted survey state:', error);
    return null;
  }
};

const persistState = (state: SurveyState) => {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      version: 1,
      data: {
        ...state,
        startedAt: state.startedAt.toISOString(),
        completedAt: state.completedAt ? state.completedAt.toISOString() : null,
        questionsAnswered: state.questionsAnswered.map(item => ({
          ...item,
          timestamp: item.timestamp.toISOString(),
        })),
      },
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to persist survey state:', error);
  }
};

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SurveyState>(() => loadPersistedState() || getDefaultState());

  useEffect(() => {
    persistState(state);
  }, [state]);

  const setProfileCode = (code: string) => {
    setState(prev => ({
      ...prev,
      profileCode: code,
      currentPage: 'quiz',
    }));
  };

  const setAssessmentAnswers = (answers: Record<string, number | string>) => {
    setState(prev => ({
      ...prev,
      assessmentAnswers: answers,
    }));
  };

  const setBiodata = (biodata: RespondentBiodata) => {
    setState(prev => ({
      ...prev,
      biodata,
    }));
  };

  const addQuizResponse = (response: QuizResponse) => {
    setState(prev => ({
      ...prev,
      questionsAnswered: [...prev.questionsAnswered, response],
    }));
  };

  const completeQuiz = () => {
    setState(prev => ({
      ...prev,
      currentPage: 'evaluation',
    }));
  };

  const addEvaluation = (evaluation: EvaluationResponse) => {
    setState(prev => ({
      ...prev,
      evaluationResponses: [...prev.evaluationResponses, evaluation],
    }));
  };

  const completeSurvey = async () => {
    const completionTime = new Date();
    setState(prev => ({
      ...prev,
      currentPage: 'thank-you',
      completedAt: completionTime,
    }));

    try {
      await saveSurveyResults({
        ...state,
        completedAt: completionTime,
      });
      console.log('✅ Survey results saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving survey:', error);
    }
  };

  const resetSurvey = () => {
    setState(getDefaultState());
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <SurveyContext.Provider
      value={{
        ...state,
        setProfileCode,
        setAssessmentAnswers,
        setBiodata,
        addQuizResponse,
        completeQuiz,
        addEvaluation,
        completeSurvey,
        resetSurvey,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurvey must be used within SurveyProvider');
  }
  return context;
}