// client/src/pages/QuizPage.tsx

import { useState, useEffect, useRef } from 'react';
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
      return Array.isArray(parsed) ? parsed : [options];
    } catch (e) {
      console.warn('Failed to parse options:', options, e);
      return [options];
    }
  }
  
  return [];
}

export default function QuizPage() {
  const { profileCode, addQuizResponse, completeQuiz, questionsAnswered, resetSurvey, updateQuickRating } = useSurvey();

  // Dev-only reset handler — clears localStorage and returns to start
  const IS_DEV = import.meta.env.DEV;
  function handleDevReset() {
    if (!confirm('⚠️ Reset quiz? Semua progress akan hilang.')) return;
    resetSurvey();
    window.location.href = '/';
  }

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quickRating, setQuickRating] = useState<number | null>(null); // NEW: 1–5 stars
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<SubmissionData | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

  // --- FIX 1: Track question number separately ---
  // questionNumber = 1-based index of the current question being shown
  // Only increments when the user actually moves to the NEXT question
  const [questionNumber, setQuestionNumber] = useState(1);

  // --- FIX 2: Track which question IDs have been DISPLAYED (to avoid re-selection) ---
  // Separate from questionsAnswered — shownIds tracks loaded questions,
  // questionsAnswered only gets entries when user COMPLETES a question (moves forward)
  const shownIdsRef = useRef<string[]>([]);

  const TOTAL_QUESTIONS = 8;

  // answeredIds from context — only populated when user moves past a question
  const answeredIds = questionsAnswered.map(item => item.question_id);

  const progress = (questionNumber / TOTAL_QUESTIONS) * 100;

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
        console.log(` Loaded ${data.length} active questions from Supabase`);
        setAllQuestions(data as Question[]);
        // On first load, shownIds = already answered from previous session
        shownIdsRef.current = [...answeredIds];
        loadQuestion(data as Question[], shownIdsRef.current);
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

  function loadQuestion(questions: Question[], excludeIds: string[]) {
    // Filter out already-shown questions
    const available = questions.filter(q => !excludeIds.includes(q.id));

    if (available.length === 0) {
      console.log('No more questions available → completing quiz');
      completeQuiz();
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const question = available[randomIndex];
    const parsedOptions = parseOptions(question.options);

    console.log(` Loading question ${questionNumber}/${TOTAL_QUESTIONS}: ${question.id}`);
    console.log(`   Text: ${question.text.substring(0, 60)}...`);
    console.log(`   Options:`, parsedOptions);
    console.log(`   Correct Answer Index: ${question.correct_answer}`);

    // Mark this question as shown so it won't be re-selected
    if (!shownIdsRef.current.includes(question.id)) {
      shownIdsRef.current = [...shownIdsRef.current, question.id];
    }

    setCurrentQuestion(question);
    setCurrentOptions(parsedOptions);
    setSelectedAnswer(null);
    setFeedback(null);
    setIsCorrect(null);
    setFeedbackError(null);
    setLastSubmission(null);
    setQuickRating(null);
  }

  // --- FIX 3: handleNextQuestion saves response and increments counter ---
  function handleNextQuestion(pendingResponse?: Parameters<typeof addQuizResponse>[0]) {
    // Save the response to context ONLY when moving forward
    if (pendingResponse) {
      addQuizResponse(pendingResponse);
    }

    const nextNumber = questionNumber + 1;

    if (nextNumber > TOTAL_QUESTIONS) {
      completeQuiz();
      return;
    }

    setQuestionNumber(nextNumber);
    loadQuestion(allQuestions, shownIdsRef.current);
  }

  async function requestFeedback(submission: SubmissionData): Promise<string> {
    // Use Vite proxy (/api) when VITE_API_URL is empty (local dev)
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: submission.question.text,
        userProfile: profileCode,
        userAnswer: submission.selectedOptionText,
        correctAnswer: submission.correctOptionText,
        allOptions: currentOptions,
        isCorrect: submission.isCorrect,
        attemptCount: 1,
        difficulty: submission.question.difficulty,
        questionTopic: submission.question.topic,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('Feedback API error:', response.status, errText);
      throw new Error(`Failed to get feedback (${response.status})`);
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
      console.log(' Submitting answer:');
      console.log(`   Selected: ${submission.selectedAnswer} = "${submission.selectedOptionText}"`);
      console.log(`   Correct: ${submission.question.correct_answer} = "${submission.correctOptionText}"`);
      console.log(`   Is Correct: ${submission.isCorrect}`);

      const feedbackText = await requestFeedback(submission);
      console.log(` Feedback received (${submission.isCorrect ? 'correct' : 'incorrect'})`);

      setIsCorrect(submission.isCorrect);
      setFeedback(feedbackText);

      // --- FIX 1 & 3: Do NOT call addQuizResponse here for wrong answers ---
      // For CORRECT answers: save the response but user must click "Next Question" manually
      // For WRONG answers: just show feedback and "Try Again" — no state saved to context yet

      if (submission.isCorrect) {
        // Store the pending response — will be saved when user clicks "Next Question"
        setLastSubmission(submission); // keep so handleNextQuestion can use it
      } else {
        // Wrong answer: clear lastSubmission so retry works fresh
        setLastSubmission(submission);
      }

      // --- FIX 3: NO auto-advance setTimeout ---
      // User must manually click "Next Question →" or "Try Again"

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

      setIsCorrect(lastSubmission.isCorrect);
      setFeedback(feedbackText);
      setFeedbackError(null);
    } catch (error) {
      console.error('Error getting feedback:', error);
      setFeedbackError('Masih belum bisa mengambil feedback. Silakan coba lagi nanti.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkipFeedback() {
    if (!lastSubmission) return;

    // Save with "no feedback" note and move forward
    handleNextQuestion({
      question_id: lastSubmission.question.id,
      question_text: lastSubmission.question.text,
      selected_answer: lastSubmission.selectedAnswer,
      correct_answer: lastSubmission.question.correct_answer,
      correct_answer_text: lastSubmission.correctOptionText,
      feedback: 'Feedback tidak tersedia untuk saat ini. Jawaban disimpan tanpa feedback.',
      is_correct: lastSubmission.isCorrect,
      timestamp: new Date(),
    });
  }

  // Called when user clicks "Next Question →" after a CORRECT answer
  function handleConfirmNext() {
    if (!lastSubmission) return;

    handleNextQuestion({
      question_id: lastSubmission.question.id,
      question_text: lastSubmission.question.text,
      selected_answer: lastSubmission.selectedAnswer,
      correct_answer: lastSubmission.question.correct_answer,
      correct_answer_text: lastSubmission.correctOptionText,
      feedback: feedback || '',
      is_correct: true,
      timestamp: new Date(),
    });
  }

  // Called when user clicks "Try Again" after a WRONG answer
  function handleTryAgain() {
    // Reset UI state only — do NOT add to questionsAnswered, do NOT change questionNumber
    setSelectedAnswer(null);
    setFeedback(null);
    setIsCorrect(null);
    setFeedbackError(null);
    setLastSubmission(null);
    setQuickRating(null);
    // Note: currentQuestion remains the SAME — user retries the same question
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900"> Practice Quiz</h1>
            {/* DEV ONLY: Reset button — hidden in production build */}
            {IS_DEV && (
              <button
                onClick={handleDevReset}
                title="[DEV] Reset quiz & clear localStorage"
                className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-300 rounded-full hover:bg-red-200 transition-all"
              >
                 Reset
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Question {questionNumber} of {TOTAL_QUESTIONS}
            </p>
            <p className="text-xs text-gray-500">
              Profile: <span className="font-mono font-bold text-green-600">{profileCode}</span> (LOCKED)
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
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
               Profile Locked: {profileCode} - Your feedback will be personalized to this profile
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
                onClick={() => {
                  if (feedback === null && feedbackError === null) {
                    setSelectedAnswer(idx);
                  }
                }}
                disabled={feedback !== null || feedbackError !== null}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  // CORRECT answer submitted: highlight the chosen (correct) option in green
                  isCorrect === true && idx === selectedAnswer
                    ? 'border-green-500 bg-green-50'
                  // WRONG answer submitted: mark user's wrong choice in red, rest stay neutral
                  : isCorrect === false && idx === selectedAnswer
                    ? 'border-red-400 bg-red-50'
                  // Before submission: highlight selected option in green
                  : selectedAnswer === idx && feedback === null
                    ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="flex items-start">
                  <span className="font-bold text-lg mr-4 min-w-fit">
                    {letters[idx]}.
                  </span>
                  <span className="text-gray-800 whitespace-pre-wrap flex-1">{option}</span>
                  {/*  only shown when user's chosen answer is CORRECT */}
                  {isCorrect === true && idx === selectedAnswer && (
                    <span className="ml-2 text-green-600 font-bold"></span>
                  )}
                  {/* ✗ shown on user's wrong choice — correct answer stays hidden */}
                  {isCorrect === false && idx === selectedAnswer && (
                    <span className="ml-2 text-red-500 font-bold">✗</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Feedback Display */}
          {feedbackError && (
            <div className="mb-6 p-4 rounded-lg border-l-4 border-red-500 bg-red-50 whitespace-pre-wrap leading-relaxed">
              <p className="text-red-900 font-semibold mb-1">⚠️ Feedback Error</p>
              <p className="text-red-800">{feedbackError}</p>
            </div>
          )}

          {feedback && (
            <div
              className={`mb-6 p-5 rounded-lg border-l-4 leading-relaxed ${
                isCorrect
                  ? 'bg-green-50 border-green-500'
                  : 'bg-yellow-50 border-yellow-500'
              }`}
            >
              <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-700' : 'text-yellow-700'}`}>
                {isCorrect ? ' Correct!' : ' Feedback'}
              </p>
              {/* Split AI output on \n\n so each paragraph gets its own breathing room */}
              <div className={`space-y-3 ${isCorrect ? 'text-green-900' : 'text-yellow-900'}`}>
                {feedback.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {para.trim()}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ===== QUICK RATING — muncul tepat setelah feedback ===== */}
          {feedback && currentQuestion && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Seberapa membantu feedback ini?
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      setQuickRating(star);
                      // Persist immediately to context (updateQuickRating finds by question_id)
                      if (lastSubmission) {
                        updateQuickRating(lastSubmission.question.id, star);
                      }
                    }}
                    title={['', 'Tidak membantu', 'Kurang membantu', 'Cukup membantu', 'Membantu', 'Sangat membantu'][star]}
                    className={`text-2xl transition-all transform hover:scale-125 ${
                      quickRating !== null && star <= quickRating
                        ? 'text-yellow-400 scale-110'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {quickRating && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  {['', 'Tidak membantu', 'Kurang membantu', 'Cukup membantu', 'Membantu', 'Sangat membantu'][quickRating]}
                </p>
              )}
            </div>
          )}


          {/* Submit button — only shown before answer is submitted */}
          {feedback === null && !feedbackError && (
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
                  Generating feedback...
                </span>
              ) : (
                'Submit Answer'
              )}
            </button>
          )}

          {/* Error state buttons */}
          {feedbackError && (
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={handleRetryFeedback}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-70"
              >
                {isSubmitting ? 'Retrying...' : ' Retry Feedback'}
              </button>
              <button
                onClick={handleSkipFeedback}
                className="w-full py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Skip & Continue →
              </button>
              <button
                onClick={handleTryAgain}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                ← Back
              </button>
            </div>
          )}

          {/* FIX 3: After CORRECT answer — user must click Next manually (NO auto-advance) */}
          {isCorrect === true && feedback !== null && (
            <button
              onClick={handleConfirmNext}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              {questionNumber >= TOTAL_QUESTIONS ? 'Move to Evaluation →' : 'Next Question →'}
            </button>
          )}

          {/* FIX 1 & 2: After WRONG answer — Try Again does NOT advance counter or save response */}
          {isCorrect === false && feedback !== null && (
            <button
              onClick={handleTryAgain}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
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
