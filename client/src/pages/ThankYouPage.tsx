// client/src/pages/ThankYouPage.tsx

import { useSurvey } from '../contexts/SurveyContext';

export default function ThankYouPage() {
  const { profileCode, biodata, resetSurvey } = useSurvey();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <div className="max-w-2xl bg-white rounded-xl shadow-2xl p-12 text-center">
        <div className="text-7xl mb-6 animate-bounce">🎉</div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Thank You!
        </h1>

        <p className="text-xl text-gray-700 mb-8">
          Your feedback has been successfully recorded and will help us improve adaptive learning systems.
        </p>

        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-8">
          <p className="font-semibold text-green-900 mb-2">✅ Survey Completed</p>
          <p className="text-gray-800">
            Your profile <span className="font-mono font-bold text-green-600">{profileCode}</span> and evaluation responses 
            have been securely saved and will be analyzed to evaluate the effectiveness of personalized AI feedback.
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-700 mb-2">📊 Your Data:</p>
          <ul className="text-left space-y-2 text-sm text-gray-700">
            {biodata && (
              <>
                <li>✓ Nama: {biodata.nama}</li>
                <li>✓ NIM: {biodata.nim}</li>
                <li>✓ Jurusan: {biodata.jurusan}</li>
                <li>✓ WhatsApp: {biodata.whatsapp}</li>
                <li>✓ Consent: Accepted</li>
              </>
            )}
            <li>✓ Learning profile: {profileCode}</li>
            <li>✓ Quiz responses: Recorded</li>
            <li>✓ Feedback evaluations: Saved</li>
            <li>✓ Timestamps: Tracked</li>
          </ul>
        </div>

        <div className="space-y-3">
          <a
            href="/"
            className="inline-block w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-lg"
          >
            Start Another Survey
          </a>

          <p className="text-sm text-gray-600">
            or close this window to exit
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Thank you for contributing to research on adaptive learning systems!
          </p>
        </div>
      </div>
    </div>
  );
}