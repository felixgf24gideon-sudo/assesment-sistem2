// client/src/pages/DashboardPage.tsx
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            AI Adaptive Practice
          </h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome, {user.full_name}! 👋
          </h2>
          <p className="text-gray-600">
            Ready to start your adaptive learning journey?
          </p>
        </div>

        {/* Profile Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Your Profile
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profile Code:</span>
                <span className="font-mono font-bold text-blue-600">
                  {user.profile_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pedagogic Level:</span>
                <span className="font-medium">Level {user.pedagogic_level}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Cognitive Style
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Visual:</span>
                <span className="font-medium">
                  {user.visual_preference === 'T' ? 'Text-based' : 'Picture-based'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing:</span>
                <span className="font-medium">
                  {user.processing_orientation === 'G' ? 'Global' : 'Analytic'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo:</span>
                <span className="font-medium">
                  {user.behavioral_tempo === 'I' ? 'Impulsive' : 'Reflective'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Progress Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {user.total_questions_attempted}
              </p>
              <p className="text-sm text-gray-600">Questions Attempted</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {user.total_questions_correct}
              </p>
              <p className="text-sm text-gray-600">Questions Correct</p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">
            Ready to Practice?
          </h3>
          <p className="mb-6 text-blue-100">
            Start answering questions and receive adaptive AI feedback
          </p>
          <a
            href="/practice"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Start Practice Session
          </a>
        </div>
      </main>
    </div>
  );
}