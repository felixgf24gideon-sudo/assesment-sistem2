import { useEffect } from 'react';
import { useLearning } from '../contexts/LearningContext';
import { questions } from '../data/questions';
import { submitAnswer } from '../services/api';
import { FeedbackPanel } from './FeedbackPanel';

export function QuestionCard() {
  const { state, dispatch } = useLearning();
  const currentQuestion = questions[state.currentQuestionIndex];

  useEffect(() => {
    if (state.correctnessState === 'correct') {
      const timer = setTimeout(() => {
        if (state.currentQuestionIndex < questions.length - 1) {
          dispatch({ type: 'NEXT_QUESTION' });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.correctnessState, state.currentQuestionIndex, dispatch]);

  const handleAnswerSelect = (index: number) => {
    if (state.isLoading || state.correctnessState === 'correct') return;
    dispatch({ type: 'SELECT_ANSWER', payload: index });
  };

  const handleSubmit = async () => {
    if (state.selectedAnswer === null || !state.profile || state.isLoading) return;

    dispatch({ type: 'SUBMIT_ANSWER' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await submitAnswer(
        state.profile.profileCode,
        currentQuestion.id,
        state.selectedAnswer,
        state.attemptCount + 1
      );

      dispatch({
        type: 'FEEDBACK_RECEIVED',
        payload: {
          feedback: response.feedback,
          isCorrect: response.isCorrect
        }
      });

      if (!response.isCorrect) {
        dispatch({ type: 'SELECT_ANSWER', payload: null });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      alert('Failed to get feedback. Please try again.');
    }
  };

  if (state.currentQuestionIndex >= questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Practice Complete!</h2>
          <p className="text-gray-600 mb-4">
            You answered {state.sessionProgress.answeredCorrectly} out of {state.sessionProgress.totalQuestions} questions correctly.
          </p>
          <p className="text-sm text-gray-500">
            Accuracy: {Math.round((state.sessionProgress.answeredCorrectly / state.sessionProgress.totalQuestions) * 100)}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Attempt:</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-semibold text-gray-700">
              {state.attemptCount + 1}
            </span>
          </div>
          <div className="bg-blue-100 px-3 py-1 rounded-full">
            <span className="text-sm font-semibold text-blue-800">{state.profile?.profileCode}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {state.currentQuestionIndex + 1} of {questions.length}</span>
            <span className="font-medium">Correct: {state.sessionProgress.answeredCorrectly}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((state.currentQuestionIndex) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestion.text}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  state.selectedAnswer === index
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${state.isLoading || state.correctnessState === 'correct' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={state.selectedAnswer === index}
                  onChange={() => handleAnswerSelect(index)}
                  disabled={state.isLoading || state.correctnessState === 'correct'}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-800">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={state.selectedAnswer === null || state.isLoading || state.correctnessState === 'correct'}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {state.isLoading ? 'Submitting...' : 'Submit Answer'}
        </button>

        <FeedbackPanel
          state={state.correctnessState}
          feedback={state.aiFeedback}
          isLoading={state.isLoading}
        />
      </div>
    </div>
  );
}
