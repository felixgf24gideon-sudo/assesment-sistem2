// client/src/pages/PracticePage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: number;
  difficulty: number;
  topic: string;
}

export default function PracticePage() {
  const { user } = useAuth();
  
  // ========== NEW: Profile Selector ==========
  const [userProfile, setUserProfile] = useState<string>('3TGI');
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(1);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  useEffect(() => {
    // Load user profile from database
    loadUserProfile();
    fetchNextQuestion();
  }, []);

  async function loadUserProfile() {
    try {
      if (user?.id) {
        const { data } = await supabase
          .from('users')
          .select('profile')
          .eq('id', user.id)
          .single();
        
        if (data?.profile) {
          setUserProfile(data.profile);
          console.log('✅ User profile loaded from DB:', data.profile);
        }
      }
    } catch (error) {
      console.log('Using default profile: 3TGI');
    }
  }

  async function fetchNextQuestion() {
    try {
      setIsLoading(true);
      
      console.log('Fetching questions from database...');
      
      const minDifficulty = Math.max(1, (user?.pedagogic_level || 3) - 1);
      const maxDifficulty = Math.min(6, (user?.pedagogic_level || 3) + 1);
      
      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .gte('difficulty', minDifficulty)
        .lte('difficulty', maxDifficulty);
      
      if (answeredQuestions.length > 0) {
        query = query.not('id', 'in', `(${answeredQuestions.join(',')})`);
      }
      
      const { data, error } = await query.limit(10);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} available questions`);

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        const selectedQuestion = data[randomIndex];
        
        console.log('Selected question:', {
          id: selectedQuestion.id,
          preview: selectedQuestion.text.substring(0, 50) + '...',
          difficulty: selectedQuestion.difficulty,
          topic: selectedQuestion.topic
        });
        
        setCurrentQuestion(selectedQuestion);
        setSelectedAnswer(null);
        setFeedback(null);
        setIsCorrect(null);
        setAttemptCount(0);
        setShowExplanation(false);
        setAiExplanation('');
      } else {
        console.log('No more questions available');
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      alert('Gagal memuat soal. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnswerSelect(index: number) {
    if (isCorrect !== true) {
      console.log(`Answer selected: ${['A', 'B', 'C', 'D', 'E'][index]}`);
      setSelectedAnswer(index);
    }
  }

  async function handleSubmit() {
    if (selectedAnswer === null || !currentQuestion) return;

    setIsSubmitting(true);
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    console.log(`Submitting answer: ${['A', 'B', 'C', 'D', 'E'][selectedAnswer]}`);
    console.log(`Correct answer: ${['A', 'B', 'C', 'D', 'E'][currentQuestion.correct_answer]}`);
    console.log(`Attempt: ${newAttemptCount}`);
    console.log(`Using profile: ${userProfile}`); // ← LOG PROFILE

    try {
      const correct = selectedAnswer === currentQuestion.correct_answer;
      
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const userAnswerText = letters[selectedAnswer];
      const correctAnswerText = letters[currentQuestion.correct_answer];

      const requestPayload = {
        questionText: currentQuestion.text,
        questionTopic: currentQuestion.topic,
        userAnswer: `${userAnswerText}. ${currentQuestion.options[selectedAnswer]}`,
        correctAnswer: `${correctAnswerText}. ${currentQuestion.options[currentQuestion.correct_answer]}`,
        allOptions: currentQuestion.options,
        isCorrect: correct,
        attemptCount: newAttemptCount,
        userProfile: userProfile, // ← USE DROPDOWN VALUE
        difficulty: currentQuestion.difficulty
      };

      console.log('🤖 Calling AI feedback API...');
      console.log('   Profile:', userProfile);
      
      const response = await fetch('http://localhost:3001/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI feedback received');

      if (correct) {
        console.log('Answer is CORRECT!');
        setIsCorrect(true);
        setAnsweredQuestions(prev => [...prev, currentQuestion.id]);
        setFeedback(data.feedback || '🎉 Benar! Jawaban Anda tepat.');
      } else {
        console.log('Answer is WRONG - Allow retry');
        setFeedback(data.feedback || `💡 Belum tepat. Coba lagi! (Percobaan ke-${newAttemptCount})`);
        setSelectedAnswer(null);
      }
      
    } catch (error) {
      console.error('❌ Error calling feedback API:', error);
      
      const correct = selectedAnswer === currentQuestion.correct_answer;
      
      if (correct) {
        setIsCorrect(true);
        setAnsweredQuestions(prev => [...prev, currentQuestion.id]);
        setFeedback('🎉 Benar! Jawaban Anda tepat.');
      } else {
        const fallbackHints = [
          '💡 Perhatikan kembali detail di soal.',
          '💡 Coba analisis setiap opsi dengan lebih teliti.',
          '💡 Jawaban yang benar adalah yang memenuhi SEMUA kondisi dalam soal.',
        ];
        const hintIndex = Math.min(newAttemptCount - 1, fallbackHints.length - 1);
        setFeedback(fallbackHints[hintIndex]);
        setSelectedAnswer(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGetExplanation() {
    if (!currentQuestion) return;

    setLoadingExplanation(true);
    console.log('📖 Requesting AI detailed explanation...');
    console.log('   Profile:', userProfile); // ← USE DROPDOWN VALUE

    try {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const correctAnswerText = `${letters[currentQuestion.correct_answer]}. ${currentQuestion.options[currentQuestion.correct_answer]}`;

      const response = await fetch('http://localhost:3001/api/explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: currentQuestion.text,
          correctAnswer: correctAnswerText,
          allOptions: currentQuestion.options.map((opt, idx) => `${letters[idx]}. ${opt}`),
          userProfile: userProfile // ← USE DROPDOWN VALUE
        })
      });

      console.log('📡 Explanation response status:', response.status);

      if (!response.ok) {
        throw new Error(`Explanation request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Explanation received');

      setAiExplanation(data.explanation);
      setShowExplanation(true);
    } catch (error) {
      console.error('❌ Error getting explanation:', error);
      setAiExplanation('⚠️ Gagal memuat penjelasan. Silakan coba lagi.');
      setShowExplanation(true);
    } finally {
      setLoadingExplanation(false);
    }
  }

  function handleNextQuestion() {
    console.log('Moving to next question...');
    setQuestionCount(prev => prev + 1);
    fetchNextQuestion();
  }

  function handleBackToDashboard() {
    window.location.href = '/dashboard';
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Memuat soal...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Selamat!</h2>
          <p className="text-gray-600 mb-6">
            {answeredQuestions.length > 0 
              ? `Anda telah menyelesaikan ${answeredQuestions.length} soal.`
              : 'Tidak ada soal tersedia saat ini.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleBackToDashboard}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Kembali ke Dashboard
            </button>
            <button
              onClick={() => {
                setAnsweredQuestions([]);
                setQuestionCount(1);
                fetchNextQuestion();
              }}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Mulai Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Practice Session</h1>
              <p className="text-sm text-gray-600 mt-1">
                Soal {questionCount} • Level {currentQuestion.difficulty} • {currentQuestion.topic}
              </p>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* ========== PROFILE SELECTOR (NEW) ========== */}
        <div className="mb-6 bg-white p-5 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎯</span>
            <label className="text-lg font-bold text-gray-900">
              Pilih Profil Pembelajaran
            </label>
          </div>
          
          <select
            value={userProfile}
            onChange={(e) => {
              setUserProfile(e.target.value);
              console.log('✅ Profile changed to:', e.target.value);
            }}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium"
          >
            <optgroup label="📚 Pemula (Level 1-2)">
              <option value="1TGI">1TGI - Pemula, Text, Global, Cepat (~40 kata)</option>
              <option value="1TGR">1TGR - Pemula, Text, Global, Detail (~80 kata)</option>
              <option value="1TAI">1TAI - Pemula, Text, Analytic, Cepat</option>
              <option value="1TAR">1TAR - Pemula, Text, Analytic, Detail</option>
              <option value="1PGI">1PGI - Pemula, Visual+Emoji, Global, Cepat</option>
              <option value="1PGR">1PGR - Pemula, Visual+Emoji, Global, Detail</option>
              <option value="1PAI">1PAI - Pemula, Visual+Emoji, Analytic, Cepat</option>
              <option value="1PAR">1PAR - Pemula, Visual+Emoji, Analytic, Detail</option>
              
              <option value="2TGI">2TGI - Pemula-Menengah, Text, Global, Cepat</option>
              <option value="2TGR">2TGR - Pemula-Menengah, Text, Global, Detail</option>
              <option value="2TAI">2TAI - Pemula-Menengah, Text, Analytic, Cepat</option>
              <option value="2TAR">2TAR - Pemula-Menengah, Text, Analytic, Detail</option>
              <option value="2PGI">2PGI - Pemula-Menengah, Visual, Global, Cepat</option>
              <option value="2PGR">2PGR - Pemula-Menengah, Visual, Global, Detail</option>
              <option value="2PAI">2PAI - Pemula-Menengah, Visual, Analytic, Cepat</option>
              <option value="2PAR">2PAR - Pemula-Menengah, Visual, Analytic, Detail</option>
            </optgroup>
            
            <optgroup label="📖 Menengah (Level 3-4)">
              <option value="3TGI">3TGI - Menengah, Text, Global, Cepat (Default, ~50 kata)</option>
              <option value="3TGR">3TGR - Menengah, Text, Global, Detail (~100 kata)</option>
              <option value="3TAI">3TAI - Menengah, Text, Analytic, Cepat</option>
              <option value="3TAR">3TAR - Menengah, Text, Analytic, Detail</option>
              <option value="3PGI">3PGI - Menengah, Visual, Global, Cepat</option>
              <option value="3PGR">3PGR - Menengah, Visual, Global, Detail</option>
              <option value="3PAI">3PAI - Menengah, Visual, Analytic, Cepat</option>
              <option value="3PAR">3PAR - Menengah, Visual, Analytic, Detail</option>
              
              <option value="4TGI">4TGI - Menengah-Lanjut, Text, Global, Cepat</option>
              <option value="4TGR">4TGR - Menengah-Lanjut, Text, Global, Detail</option>
              <option value="4TAI">4TAI - Menengah-Lanjut, Text, Analytic, Cepat</option>
              <option value="4TAR">4TAR - Menengah-Lanjut, Text, Analytic, Detail</option>
              <option value="4PGI">4PGI - Menengah-Lanjut, Visual, Global, Cepat</option>
              <option value="4PGR">4PGR - Menengah-Lanjut, Visual, Global, Detail</option>
              <option value="4PAI">4PAI - Menengah-Lanjut, Visual, Analytic, Cepat</option>
              <option value="4PAR">4PAR - Menengah-Lanjut, Visual, Analytic, Detail</option>
            </optgroup>
            
            <optgroup label="🎓 Expert (Level 5-6)">
              <option value="5TGI">5TGI - Lanjut, Text, Global, Cepat</option>
              <option value="5TGR">5TGR - Lanjut, Text, Global, Detail</option>
              <option value="5TAI">5TAI - Lanjut, Text, Analytic, Cepat</option>
              <option value="5TAR">5TAR - Lanjut, Text, Analytic, Detail</option>
              <option value="5PGI">5PGI - Lanjut, Visual, Global, Cepat</option>
              <option value="5PGR">5PGR - Lanjut, Visual, Global, Detail</option>
              <option value="5PAI">5PAI - Lanjut, Visual, Analytic, Cepat</option>
              <option value="5PAR">5PAR - Lanjut, Visual, Analytic, Detail</option>
              
              <option value="6TGI">6TGI - Expert, Text, Global, Cepat (~60 kata)</option>
              <option value="6TGR">6TGR - Expert, Text, Global, Detail (~120 kata)</option>
              <option value="6TAI">6TAI - Expert, Text, Analytic, Cepat</option>
              <option value="6TAR">6TAR - Expert, Text, Analytic, Detail</option>
              <option value="6PGI">6PGI - Expert, Visual, Global, Cepat</option>
              <option value="6PGR">6PGR - Expert, Visual, Global, Detail</option>
              <option value="6PAI">6PAI - Expert, Visual, Analytic, Cepat</option>
              <option value="6PAR">6PAR - Expert, Visual, Analytic, Detail (~400 kata!)</option>
            </optgroup>
          </select>
          
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-gray-800">
              Profil aktif: <span className="font-mono text-blue-700 text-base">{userProfile}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              💡 Ganti profil untuk melihat perbedaan gaya feedback AI
            </p>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              Soal {questionCount}
            </span>
            <span className="text-sm text-gray-500">Level {currentQuestion.difficulty}</span>
          </div>

          <div className="mb-8">
            <p className="text-lg text-gray-800 whitespace-pre-line leading-relaxed">
              {currentQuestion.text}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const letters = ['A', 'B', 'C', 'D', 'E'];
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === currentQuestion.correct_answer;
              
              const showCorrect = isCorrect === true && isCorrectAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isCorrect === true}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected && isCorrect !== true ? 'border-blue-500 bg-blue-50 shadow-md' : ''
                  } ${showCorrect ? 'border-green-500 bg-green-50 shadow-md' : ''} ${
                    !isSelected && isCorrect !== true
                      ? 'border-gray-300 hover:border-blue-300 hover:bg-gray-50 hover:shadow'
                      : ''
                  } ${isCorrect === true ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start">
                    <span className={`font-bold mr-3 text-lg flex-shrink-0 ${
                      showCorrect ? 'text-green-600' : 'text-gray-700'
                    }`}>
                      {letters[index]}.
                    </span>
                    <span className="text-gray-800 flex-1">{option}</span>
                    {showCorrect && <span className="text-green-600 ml-2 text-xl">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {attemptCount > 0 && isCorrect !== true && (
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4 px-1">
              <span>Percobaan ke-{attemptCount}</span>
              {attemptCount >= 3 && (
                <span className="text-amber-600 font-medium">💡 Coba perhatikan lebih detail</span>
              )}
            </div>
          )}

          {isCorrect !== true && (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                selectedAnswer === null
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? 'Memeriksa jawaban...' : 'Submit Jawaban'}
            </button>
          )}

          {isCorrect === true && (
            <button
              onClick={handleNextQuestion}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Soal Berikutnya →
            </button>
          )}
        </div>

        {/* Feedback and AI Explanation Section */}
        {feedback && (
          <div className="space-y-4">
            <div className={`rounded-xl shadow-xl p-6 border-2 ${
              isCorrect === true
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
            }`}>
              <h3 className={`text-xl font-bold mb-3 flex items-center ${
                isCorrect === true ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {isCorrect === true ? (
                  <>
                    <span className="text-2xl mr-2">✅</span>
                    Jawaban Benar!
                  </>
                ) : (
                  <>
                    <span className="text-2xl mr-2">💡</span>
                    Petunjuk
                  </>
                )}
              </h3>
              <p className={`text-base leading-relaxed whitespace-pre-line ${
                isCorrect === true ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {feedback}
              </p>
            </div>

            {isCorrect === true && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGetExplanation}
                  disabled={loadingExplanation}
                  className={`
                    px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg
                    ${loadingExplanation 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transform hover:-translate-y-0.5'
                    }
                  `}
                >
                  {loadingExplanation ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin text-xl">⏳</span>
                      <span>Memuat penjelasan AI...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">🤖</span>
                      <span>Lihat Penjelasan Detail AI</span>
                    </span>
                  )}
                </button>

                {showExplanation && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 p-6 shadow-xl animate-fadeIn">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-3xl">📖</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-900 text-xl mb-1">
                          Penjelasan Detail AI
                        </h3>
                        <p className="text-sm text-blue-600">
                          Personalized untuk profil: <span className="font-semibold bg-blue-100 px-2 py-0.5 rounded">{userProfile}</span>
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-5 border border-blue-200 shadow-inner">
                      <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                        {aiExplanation}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}