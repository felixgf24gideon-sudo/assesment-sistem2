// client/src/contexts/SurveyContext.tsx

import { createContext, useContext, useState, ReactNode } from 'react';
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

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SurveyState>({
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
    setState({
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