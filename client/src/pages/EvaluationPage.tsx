// client/src/pages/EvaluationPage.tsx

import { useState } from 'react';
import { useSurvey } from '../contexts/SurveyContext';

const LIKERT_SCALE = [
  { value: 1, label: 'Sangat Tidak Setuju' },
  { value: 2, label: 'Tidak Setuju' },
  { value: 3, label: 'Netral' },
  { value: 4, label: 'Setuju' },
  { value: 5, label: 'Sangat Setuju' },
];

const RATING_DIMENSIONS = [
  // Bagian I: Akurasi Penjelasan (Accuracy)
  {
    key: 'accuracy_positive',
    section: ' Akurasi Penjelasan',
    question: 'AI berhasil mendeteksi letak kesalahan saya dengan sangat tepat.',
    isNegative: false,
  },
  {
    key: 'accuracy_negative',
    section: ' Akurasi Penjelasan',
    question: 'Saya merasa koreksi yang diberikan AI tidak sesuai dengan kesalahan yang saya buat.',
    isNegative: false,
  },
  // Bagian II: Kejelasan Bahasa (Clarity)
  {
    key: 'clarity_positive',
    section: ' Kejelasan Bahasa',
    question: 'Penjelasan yang diberikan AI sangat mudah dipahami dalam sekali baca.',
    isNegative: false,
  },
  {
    key: 'clarity_negative',
    section: ' Kejelasan Bahasa',
    question: 'Saya merasa bingung dan harus membaca ulang penjelasan AI berkali-kali.',
    isNegative: false,
  },
  // Bagian III: Kesesuaian Gaya Belajar (Personalization Fit)
  {
    key: 'personalization_positive',
    section: ' Kesesuaian Gaya Belajar',
    question: 'Gaya bahasa AI (penggunaan analogi atau logika) terasa sangat cocok dengan cara belajar saya.',
    isNegative: false,
  },
  {
    key: 'personalization_negative',
    section: ' Kesesuaian Gaya Belajar',
    question: 'Cara AI menyampaikan penjelasan terasa kaku dan tidak cocok untuk saya pribadi.',
    isNegative: false,
  },
  // Bagian IV: Panjang Penjelasan (Tempo/Pacing)
  {
    key: 'pacing_positive',
    section: ' Panjang Penjelasan',
    question: 'Panjang teks penjelasan AI terasa pas, tidak bertele-tele maupun terlalu singkat.',
    isNegative: false,
  },
  {
    key: 'pacing_negative',
    section: 'Panjang Penjelasan',
    question: 'Informasi yang diberikan AI terasa membosankan karena terlalu panjang dan melelahkan untuk dibaca.',
    isNegative: false,
  },
  // Bagian V: Dampak Belajar (Empowerment)
  {
    key: 'empowerment_positive',
    section: ' Dampak Belajar',
    question: 'Saya merasa lebih yakin bisa mengerjakan soal serupa setelah membaca masukan dari AI.',
    isNegative: false,
  },
  {
    key: 'empowerment_negative',
    section: ' Dampak Belajar',
    question: 'Penjelasan AI tidak banyak membantu saya memahami konsep materi secara lebih mendalam.',
    isNegative: false,
  },
];

export default function EvaluationPage() {
  const { profileCode, questionsAnswered, addEvaluation, completeSurvey } = useSurvey();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  const [openFeedback, setOpenFeedback] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentResponse = questionsAnswered[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questionsAnswered.length - 1;
  const currentRatings = ratings[currentResponse.question_id] || {};
  const allRatingsComplete = RATING_DIMENSIONS.every(d => currentRatings[d.key]);

  const handleRating = (dimension: string, value: number) => {
    setRatings(prev => ({
      ...prev,
      [currentResponse.question_id]: {
        ...prev[currentResponse.question_id],
        [dimension]: value,
      },
    }));
  };

  const handleNext = async () => {
    if (!allRatingsComplete) {
      alert('Please rate all dimensions before proceeding');
      return;
    }

    // Save evaluation for current question
    addEvaluation({
      question_id: currentResponse.question_id,
      ratings: {
        accuracy_positive: currentRatings.accuracy_positive || 0,
        accuracy_negative: currentRatings.accuracy_negative || 0,
        clarity_positive: currentRatings.clarity_positive || 0,
        clarity_negative: currentRatings.clarity_negative || 0,
        personalization_positive: currentRatings.personalization_positive || 0,
        personalization_negative: currentRatings.personalization_negative || 0,
        pacing_positive: currentRatings.pacing_positive || 0,
        pacing_negative: currentRatings.pacing_negative || 0,
        empowerment_positive: currentRatings.empowerment_positive || 0,
        empowerment_negative: currentRatings.empowerment_negative || 0,
      },
      open_feedback: openFeedback[currentResponse.question_id] || '',
    });

    if (isLastQuestion) {
      setIsSubmitting(true);
      try {
        await completeSurvey();
      } catch (error) {
        console.error('Error completing survey:', error);
        alert('Error saving survey. Please try again.');
        setIsSubmitting(false);
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (!currentResponse) {
    return <div>Error loading evaluation</div>;
  }

  const letters = ['A', 'B', 'C', 'D', 'E'];
  const progress = ((currentQuestionIndex + 1) / questionsAnswered.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Evaluate the Feedback
        </h1>
        <p className="text-gray-600">
          Question {currentQuestionIndex + 1} of {questionsAnswered.length} • Profile: {profileCode}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden mt-4">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 space-y-6">
          {/* Question */}
          <div className="border-b pb-6">
            <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Question</h3>
            <p className="text-lg text-gray-900 whitespace-pre-wrap">{currentResponse.question_text}</p>
          </div>

          {/* Your Answer */}
          <div className="border-b pb-6">
            <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Your Answer</h3>
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white ${
                  currentResponse.is_correct ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {letters[currentResponse.selected_answer]}
              </div>
              <div>
                <p className="text-lg text-gray-900 font-semibold">
                  {currentResponse.correct_answer_text}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {currentResponse.is_correct ? ' Correct' : ' Incorrect'}
                </p>
              </div>
            </div>
          </div>

          {/* Correct Answer (if wrong) */}
          {!currentResponse.is_correct && (
            <div className="border-b pb-6 bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-bold text-green-900 uppercase mb-2">Correct Answer</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white bg-green-500">
                  {letters[currentResponse.correct_answer]}
                </div>
                <p className="text-lg text-green-900 font-semibold">
                  {currentResponse.correct_answer_text}
                </p>
              </div>
            </div>
          )}

          {/* Feedback Received */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
            <h3 className="text-sm font-bold text-blue-900 uppercase mb-3">Feedback You Received</h3>
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
              {currentResponse.feedback}
            </p>
          </div>

          {/* Ratings */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-8">
              Silakan Berikan Rating Anda <span className="text-red-500">*</span>
            </h3>

            <div className="space-y-8">
              {RATING_DIMENSIONS.map(({ key, section, question, isNegative }) => (
                <div key={key} className="border-l-4 border-blue-300 pl-4">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-2">{section}</p>
                  <label className="block mb-4">
                    <span className="font-semibold text-gray-900">
                      {question}
                      {isNegative && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Soal Negatif</span>}
                    </span>
                  </label>

                  <div className="flex gap-1 items-center flex-wrap">
                    {LIKERT_SCALE.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => handleRating(key, value)}
                        title={label}
                        className={`px-3 py-2 rounded-lg font-bold text-sm transition-all transform hover:scale-110 ${
                          currentRatings[key] === value
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-110 shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                    <div className="flex-1 text-right">
                      <span className="text-sm font-semibold text-gray-600">
                        {currentRatings[key] ? `${currentRatings[key]}/5 - ${LIKERT_SCALE.find(s => s.value === currentRatings[key])?.label || ''}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Feedback */}
          <div className="border-t pt-8">
            <label className="block">
              <span className="text-sm font-bold text-gray-900 uppercase block mb-3">
                Any Additional Comments? (Optional)
              </span>
              <textarea
                value={openFeedback[currentResponse.question_id] || ''}
                onChange={(e) =>
                  setOpenFeedback(prev => ({
                    ...prev,
                    [currentResponse.question_id]: e.target.value,
                  }))
                }
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={4}
                placeholder="Share your thoughts about this feedback (what was good, what could be improved, etc.)"
              />
            </label>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 pt-8 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              ← Back
            </button>

            <button
              onClick={handleNext}
              disabled={!allRatingsComplete || isSubmitting}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                allRatingsComplete && !isSubmitting
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Saving...
                </span>
              ) : isLastQuestion ? (
                '✅ Complete Survey'
              ) : (
                'Next Question →'
              )}
            </button>
          </div>

          {!allRatingsComplete && (
            <p className="text-center text-sm text-red-600 font-semibold">
              Silakan berikan rating untuk semua 10 pertanyaan sebelum melanjutkan
            </p>
          )}
        </div>
      </div>
    </div>
  );
}