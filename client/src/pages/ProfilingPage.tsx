// client/src/pages/ProfilingPage.tsx

import { FormEvent, useState } from 'react';
import { useSurvey } from '../contexts/SurveyContext';
import { PROFILING_QUESTIONS, calculateProfileCode } from '../data/profilingQuestions';

const CONSENT_TEXT =
  'Seluruh data yang dikumpulkan dalam sistem ini murni digunakan untuk kepentingan penelitian skripsi dan dipastikan tidak akan memengaruhi penilaian akademik Anda dalam mata kuliah apa pun. Oleh karena itu, mohon berikan jawaban yang sejujur-jujurnya berdasarkan kemampuan pribadi tanpa menggunakan bantuan alat AI eksternal agar validitas riset tetap terjaga. Anda tidak perlu merasa terbebani selama pengerjaan karena fokus utama kami adalah menangkap pengalaman belajar Anda yang apa adanya sebagai bahan analisis ilmiah. Dengan melanjutkan ke tahap berikutnya, Anda menyatakan kesediaan untuk berpartisipasi dalam penelitian ini secara sukarela dan tanpa paksaan.';

export default function ProfilingPage() {
  const {
    setProfileCode,
    setAssessmentAnswers,
    setBiodata,
    assessmentAnswers,
  } = useSurvey();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, number | string>>(assessmentAnswers);
  const [showResult, setShowResult] = useState(false);
  const [profileResult, setProfileResult] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [biodataForm, setBiodataForm] = useState({
    nama: '',
    nim: '',
    jurusan: '',
    whatsapp: '',
    consentAccepted: false,
  });
  const [formError, setFormError] = useState('');

  const currentQuestion = PROFILING_QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / PROFILING_QUESTIONS.length) * 100;
  const isAnswered = Boolean(localAnswers[currentQuestion?.id]);

  const handleAnswer = (value: number | string) => {
    setLocalAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < PROFILING_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    handleComplete();
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setAssessmentAnswers(localAnswers);

    const profileCode = calculateProfileCode(localAnswers);
    setProfileResult(profileCode);
    setShowResult(true);
  };

  const handleProceedToQuiz = () => {
    setProfileCode(profileResult || '3TGI');
  };

  const handleBiodataSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const nama = biodataForm.nama.trim();
    const nim = biodataForm.nim.trim();
    const jurusan = biodataForm.jurusan.trim();
    const whatsapp = biodataForm.whatsapp.trim();

    if (!nama || !nim || !jurusan || !whatsapp) {
      setFormError('Nama, NIM, jurusan, dan kontak WhatsApp wajib diisi.');
      return;
    }

    if (!biodataForm.consentAccepted) {
      setFormError('Anda harus menyetujui pernyataan term of condition untuk melanjutkan.');
      return;
    }

    setBiodata({
      nama,
      nim,
      jurusan,
      whatsapp,
      consentAcceptedAt: new Date().toISOString(),
    });
    setShowQuestionnaire(true);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-2xl bg-white rounded-xl shadow-2xl p-12 text-center">
          <div className="text-6xl mb-6"></div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Learning Profile</h1>

          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-8 mb-8">
            <p className="text-gray-600 mb-3 text-lg">Profile Code:</p>
            <p className="text-5xl font-mono font-bold text-blue-600">{profileResult}</p>
          </div>

          <div className="text-left space-y-4 mb-8 text-gray-700">
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-4">Level:</span>
              <span>
                {profileResult?.[0]} - {' '}
                {"123456".includes(profileResult?.[0] || '')
                  ? ['Beginner', 'Elementary', 'Intermediate', 'Intermediate-Advanced', 'Advanced', 'Expert'][
                      '123456'.indexOf(profileResult?.[0] || '0')
                    ]
                  : ''}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-4">Visual:</span>
              <span>{profileResult?.[1] === 'T' ? 'Text-based' : 'Picture-based'}</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-4">Processing:</span>
              <span>{profileResult?.[2] === 'G' ? 'Global' : 'Analytic'}</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-4">Tempo:</span>
              <span>{profileResult?.[3] === 'I' ? 'Impulsive' : 'Reflective'}</span>
            </div>
          </div>

          <p className="text-gray-600 mb-8 text-lg">
            We'll customize your learning experience based on this profile.
          </p>

          <button
            onClick={handleProceedToQuiz}
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-lg"
          >
            Start Practice Quiz →
          </button>
        </div>
      </div>
    );
  }

  if (!showQuestionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2"> Data Peserta</h1>
          <p className="text-gray-600">
            Silakan isi biodata dan setujui pernyataan sebelum melanjutkan ke asesmen profil.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleBiodataSubmit} className="bg-white rounded-xl shadow-xl p-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="nama" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama
                </label>
                <input
                  id="nama"
                  type="text"
                  value={biodataForm.nama}
                  onChange={(event) => setBiodataForm(prev => ({ ...prev, nama: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div>
                <label htmlFor="nim" className="block text-sm font-semibold text-gray-700 mb-2">
                  NIM
                </label>
                <input
                  id="nim"
                  type="text"
                  value={biodataForm.nim}
                  onChange={(event) => setBiodataForm(prev => ({ ...prev, nim: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Masukkan NIM"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="jurusan" className="block text-sm font-semibold text-gray-700 mb-2">
                Jurusan
              </label>
              <input
                id="jurusan"
                type="text"
                value={biodataForm.jurusan}
                onChange={(event) => setBiodataForm(prev => ({ ...prev, jurusan: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Masukkan jurusan"
                required
              />
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-700 mb-2">
                Kontak WhatsApp
              </label>
              <input
                id="whatsapp"
                type="text"
                value={biodataForm.whatsapp}
                onChange={(event) => setBiodataForm(prev => ({ ...prev, whatsapp: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Contoh: 08xxxxxxxxxx"
                required
              />
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-900 mb-3">Term of Condition</p>
              <p className="text-sm leading-7 text-blue-900/90">{CONSENT_TEXT}</p>
              <label className="mt-4 flex items-start gap-3 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={biodataForm.consentAccepted}
                  onChange={(event) => setBiodataForm(prev => ({ ...prev, consentAccepted: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Saya menyetujui pernyataan di atas dan bersedia melanjutkan ke tahap berikutnya.</span>
              </label>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-semibold text-white transition-all hover:shadow-lg"
            >
              Lanjut ke Asesmen
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2"> Learning Style Assessment</h1>
        <p className="text-gray-600">
          Answer questions to find your personalized learning profile ({currentIndex + 1} of{' '}
          {PROFILING_QUESTIONS.length})
        </p>
      </div>

      <div className="max-w-3xl mx-auto mb-8">
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center mt-2 text-sm font-semibold text-gray-600">
          {Math.round(progress)}% Complete
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{currentQuestion.question}</h2>

          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  localAnswers[currentQuestion.id] === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      localAnswers[currentQuestion.id] === option.value
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-400'
                    }`}
                  >
                    {localAnswers[currentQuestion.id] === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-gray-800">{option.text}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              ← Back
            </button>

            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                isAnswered
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentIndex === PROFILING_QUESTIONS.length - 1 ? 'See Result' : 'Next →'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-600">
          <p>💡 There are no right or wrong answers. Be honest about your preferences!</p>
        </div>
      </div>
    </div>
  );
}
