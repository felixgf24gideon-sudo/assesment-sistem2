import React from 'react';
import { useLearning } from '../contexts/LearningContext';

export function ProgressIndicator() {
  const { state } = useLearning();
  const { totalQuestions, answeredCorrectly } = state.sessionProgress;
  const currentQuestion = state.currentQuestionIndex + 1;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Question {currentQuestion} of {totalQuestions}</span>
        <span>Correct: {answeredCorrectly}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(answeredCorrectly / totalQuestions) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}
