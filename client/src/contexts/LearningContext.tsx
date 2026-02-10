import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { LearningState, LearningAction } from '../types';
import { questions } from '../data/questions';

const initialState: LearningState = {
  profile: null,
  currentQuestionIndex: 0,
  attemptCount: 0,
  correctnessState: 'neutral',
  selectedAnswer: null,
  aiFeedback: '',
  isLoading: false,
  sessionProgress: {
    totalQuestions: questions.length,
    answeredCorrectly: 0
  }
};

function learningReducer(state: LearningState, action: LearningAction): LearningState {
  switch (action.type) {
    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.payload
      };
    
    case 'SELECT_ANSWER':
      return {
        ...state,
        selectedAnswer: action.payload
      };
    
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        attemptCount: state.attemptCount + 1
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'FEEDBACK_RECEIVED':
      return {
        ...state,
        aiFeedback: action.payload.feedback,
        correctnessState: action.payload.isCorrect ? 'correct' : 'incorrect',
        isLoading: false,
        sessionProgress: action.payload.isCorrect ? {
          ...state.sessionProgress,
          answeredCorrectly: state.sessionProgress.answeredCorrectly + 1
        } : state.sessionProgress
      };
    
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        attemptCount: 0,
        correctnessState: 'neutral',
        selectedAnswer: null,
        aiFeedback: ''
      };
    
    case 'RESET_ATTEMPTS':
      return {
        ...state,
        attemptCount: 0
      };
    
    default:
      return state;
  }
}

interface LearningContextType {
  state: LearningState;
  dispatch: React.Dispatch<LearningAction>;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(learningReducer, initialState);

  return (
    <LearningContext.Provider value={{ state, dispatch }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within LearningProvider');
  }
  return context;
}
