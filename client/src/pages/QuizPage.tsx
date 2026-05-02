// client/src/pages/QuizPage.tsx

import { useState, useEffect } from 'react';
import { useSurvey } from '../contexts/SurveyContext';
import { supabase } from '../services/supabase';

interface Question {
  id: string;
  text: string;
  options: string[] | string; // Can be array or JSON string
  correct_answer: number;
  difficulty: number;
  topic: string;
  cognitive_tag?: string;
  is_active: boolean;
}

interface SubmissionData {
  question: Question;
  selectedAnswer: number;
  selectedOptionText: string;
  correctOptionText: string;
  isCorrect: boolean;
}

// Helper function to parse options
function parseOptions(options: string[] | string): string[] {
  if (Array.isArray(options)) {
    return options;
  }
  
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      // Handle both direct array and nested array (from JSONB)
      return Array.isArray(parsed) ? parsed : [options];
    } catch (e) {
      console.warn('Failed to parse options:', options, e);
      return [options];
    }
  }
  
  return [];
}

export default function QuizPage() {
  const { profileCode, addQuizResponse, completeQuiz, questionsAnswered } = useSurvey();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<SubmissionData | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

  const TOTAL_QUESTIONS = 8;
  const currentIndex = questionsAnswered.length;
  const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100;
  const answeredIds = questionsAnswered.map(item => item.question_id);

  useEffect(() => {
    if (!profileCode) {
      window.location.href = '/';
      return;
    }
    initializeQuiz();
  }, [profileCode]);

  async function initializeQuiz() {
    try {
      setIsLoading(true);

      // Fetch ALL active questions once
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`✅ Loaded ${data.length} active questions from Supabase`);
        setAllQuestions(data as Question[]);
        
        // Load first question
        loadQuestion(data as Question[], answeredIds);
      } else {
        console.error('No active questions found');
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error('Error initializing quiz:', error);
      setFeedback('Error loading questions. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }

  function loadQuestion(questions: Question[], answeredIds: string[]) {
    if (currentIndex >= TOTAL_QUESTIONS) {
      completeQuiz();
      return;
    }

    // Filter unanswered questions
    const unansweredQuestions = questions.filter(q => !answeredIds.includes(q.id));

    if (unansweredQuestions.length === 0) {
      console.log('No more unanswered questions');
      completeQuiz();
      return;
    }

    // Pick random question
    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    const question = unansweredQuestions[randomIndex];

    // Parse options properly
    const parsedOptions = parseOptions(question.options);
    
    console.log(` Loaded question ${currentIndex + 1}/${TOTAL_QUESTIONS}: ${question.id}`);
    console.log(`   Text: ${question.text.substring(0, 60)}...`);
    console.log(`   Options:`, parsedOptions);
    console.log(`   Correct Answer Index: ${question.correct_answer}`);

    setCurrentQuestion(question);
    setCurrentOptions(parsedOptions);
    setSelectedAnswer(null);
    setFeedback(null);
    setIsCorrect(null);
    setFeedbackError(null);
    setLastSubmission(null);
  }

  function handleNextQuestion(overrideAnsweredIds?: string[]) {
    if (currentIndex < TOTAL_QUESTIONS) {
      loadQuestion(allQuestions, overrideAnsweredIds || answeredIds);
    } else {
      completeQuiz();
    }
  }

  async function requestFeedback(submission: SubmissionData): Promise<string> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: submission.question.text,
        userProfile: profileCode,
        userAnswer: submission.selectedOptionText,
        correctAnswer: submission.correctOptionText,
        allOptions: currentOptions,
        isCorrect: submission.isCorrect,
        difficulty: submission.question.difficulty,
        questionTopic: submission.question.topic,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get feedback');
    }

    const data = await response.json();
    return data.feedback || 'No feedback available';
  }

  async function handleSubmit() {
    if (selectedAnswer === null || !currentQuestion) return;

    setIsSubmitting(true);
    setFeedbackError(null);

    const submission: SubmissionData = {
      question: currentQuestion,
      selectedAnswer,
      selectedOptionText: currentOptions[selectedAnswer],
      correctOptionText: currentOptions[currentQuestion.correct_answer],
      isCorrect: selectedAnswer === currentQuestion.correct_answer,
    };

    setLastSubmission(submission);

    try {
      console.log('🔍 Submitting answer:');
      console.log(`   Selected: ${submission.selectedAnswer} = "${submission.selectedOptionText}"`);
      console.log(`   Correct: ${submission.question.correct_answer} = "${submission.correctOptionText}"`);
      console.log(`   Is Correct: ${submission.isCorrect}`);

      const feedbackText = await requestFeedback(submission);

      console.log(` Feedback received (${submission.isCorrect ? 'correct' : 'incorrect'})`);

      // Record response
      addQuizResponse({
        question_id: submission.question.id,
        question_text: submission.question.text,
        selected_answer: submission.selectedAnswer,
        correct_answer: submission.question.correct_answer,
        correct_answer_text: submission.correctOptionText,
        feedback: feedbackText,
        is_correct: submission.isCorrect,
        timestamp: new Date(),
      });

      setLastSubmission(null);

      setIsCorrect(submission.isCorrect);
      setFeedback(feedbackText);

      // Auto-advance if correct
      if (submission.isCorrect) {
        const nextAnsweredIds = [...answeredIds, submission.question.id];
        setTimeout(() => {
          handleNextQuestion(nextAnsweredIds);
        }, 2000);
      }
    } catch (error) {
      console.error('Error getting feedback:', error);
      setFeedbackError('Feedback sedang tidak tersedia. Silakan coba lagi atau lanjut tanpa feedback.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRetryFeedback() {
    if (!lastSubmission) return;

    setIsSubmitting(true);
    setFeedbackError(null);

    try {
      const feedbackText = await requestFeedback(lastSubmission);

      addQuizResponse({
        question_id: lastSubmission.question.id,
        question_text: lastSubmission.question.text,
        selected_answer: lastSubmission.selectedAnswer,
        correct_answer: lastSubmission.question.correct_answer,
        correct_answer_text: lastSubmission.correctOptionText,
        feedback: feedbackText,
        is_correct: lastSubmission.isCorrect,
        timestamp: new Date(),
      });

      setLastSubmission(null);
      setIsCorrect(lastSubmission.isCorrect);
      setFeedback(feedbackText);

      if (lastSubmission.isCorrect) {
        const nextAnsweredIds = [...answeredIds, lastSubmission.question.id];
        setTimeout(() => {
          handleNextQuestion(nextAnsweredIds);
        }, 2000);
      }
    } catch (error) {
      console.error('Error getting feedback:', error);
      setFeedbackError('Masih belum bisa mengambil feedback. Silakan coba lagi nanti.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkipFeedback() {
    if (!lastSubmission) return;

    addQuizResponse({
      question_id: lastSubmission.question.id,
      question_text: lastSubmission.question.text,
      selected_answer: lastSubmission.selectedAnswer,
      correct_answer: lastSubmission.question.correct_answer,
      correct_answer_text: lastSubmission.correctOptionText,
      feedback: 'Feedback tidak tersedia untuk saat ini. Jawaban disimpan tanpa feedback.',
      is_correct: lastSubmission.isCorrect,
      timestamp: new Date(),
    });

    const nextAnsweredIds = [...answeredIds, lastSubmission.question.id];
    setLastSubmission(null);
    setFeedbackError(null);
    setFeedback(null);
    setIsCorrect(null);
    handleNextQuestion(nextAnsweredIds);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-green-400 border-t-green-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading quiz...</p>
          <p className="text-gray-600 text-sm mt-2">Fetching questions from database...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion || currentOptions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Questions Available</h2>
          <p className="text-gray-600 mb-6">
            Could not load questions from the database. Please check your internet connection and refresh.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">🎯 Practice Quiz</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Question {currentIndex + 1} of {TOTAL_QUESTIONS}
            </p>
            <p className="text-xs text-gray-500">
              Profile: <span className="font-mono font-bold text-green-600">{profileCode}</span> (LOCKED)
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Profile Info Box */}
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-600 rounded">
            <p className="text-sm font-semibold text-green-900">
              ✅ Profile Locked: {profileCode} - Your feedback will be personalized to this profile
            </p>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold text-gray-900 mb-8 whitespace-pre-wrap leading-relaxed">
            {currentQuestion.text}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentOptions.map((option: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedAnswer(idx)}
                disabled={isCorrect === true}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === idx && isCorrect !== true
                    ? 'border-green-500 bg-green-50'
                    : isCorrect === true && idx === currentQuestion.correct_answer
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="flex items-start">
                  <span className="font-bold text-lg mr-4 min-w-fit">
                    {letters[idx]}.
                  </span>
                  <span className="text-gray-800 whitespace-pre-wrap flex-1">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Feedback */}
          {feedbackError && (
            <div className="mb-6 p-4 rounded-lg border-l-4 border-red-500 bg-red-50 whitespace-pre-wrap leading-relaxed">
              <p className="text-red-900">{feedbackError}</p>
            </div>
          )}
          {feedback && (
            <div
              className={`mb-8 p-4 rounded-lg border-l-4 whitespace-pre-wrap leading-relaxed ${
                isCorrect ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'
              }`}
            >
              <p className={isCorrect ? 'text-green-900' : 'text-yellow-900'}>
                {feedback}
              </p>
            </div>
          )}

          {/* Buttons */}
          {!feedback && !feedbackError && (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || isSubmitting}
              className={`w-full py-4 rounded-lg font-semibold transition-all ${
                selectedAnswer !== null && !isSubmitting
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Checking...
                </span>
              ) : (
                'Submit Answer'
              )}
            </button>
          )}

          {feedbackError && (
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={handleRetryFeedback}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-70"
              >
                {isSubmitting ? 'Retrying...' : 'Retry Feedback'}
              </button>
              <button
                onClick={handleSkipFeedback}
                className="w-full py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Skip Feedback
              </button>
              <button
                onClick={() => {
                  setFeedbackError(null);
                  setLastSubmission(null);
                  setSelectedAnswer(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Back
              </button>
            </div>
          )}

          {isCorrect === true && (
            <button
              onClick={() => handleNextQuestion()}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              {currentIndex + 1 >= TOTAL_QUESTIONS ? 'Move to Evaluation →' : 'Next Question →'}
            </button>
          )}

          {isCorrect === false && (
            <button
              onClick={() => {
                setSelectedAnswer(null);
                setFeedback(null);
                setIsCorrect(null);
              }}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Question Info */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>Topic: {currentQuestion.topic} | Difficulty: Level {currentQuestion.difficulty}</p>
          {currentQuestion.cognitive_tag && <p>Cognitive Tag: {currentQuestion.cognitive_tag}</p>}
        </div>
      </div>
    </div>
  );
}