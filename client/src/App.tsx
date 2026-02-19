// client/src/App.tsx
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { LearningProvider, useLearning } from './contexts/LearningContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { QuestionCard } from './components/QuestionCard';
import { useEffect } from 'react';
import './index.css';

// Learning Flow Component (setelah login)
function LearningFlow() {
  const { user } = useAuth();
  const { state, dispatch } = useLearning();

  // Auto-set profile dari database saat mount
  useEffect(() => {
    if (user && !state.profile) {
      // Set profile dari user database
      dispatch({
        type: 'SET_PROFILE',
        payload: {
          pedagogicalLevel: user.pedagogic_level,
          cognitiveStyle: {
            visualPreference: user.visual_preference,
            processingOrientation: user.processing_orientation,
            behavioralTempo: user.behavioral_tempo,
          },
          profileCode: user.profile_code,
        },
      });
    }
  }, [user, state.profile, dispatch]);

  // Show loading while setting profile
  if (!state.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing learning session...</p>
        </div>
      </div>
    );
  }

  // Show question card once profile is set
  return <QuestionCard />;
}

// Main App Content (with routing)
function AppContent() {
  const { user, isLoading } = useAuth();
  const currentPath = window.location.pathname;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show auth pages
  if (!user) {
    if (currentPath === '/register') {
      return <RegisterPage />;
    }
    // Default: show login
    return <LoginPage />;
  }

  // Logged in - check route
  if (currentPath === '/practice') {
    // Practice mode: Show question flow
    return (
      <LearningProvider>
        <LearningFlow />
      </LearningProvider>
    );
  }

  // Default: show dashboard
  return <DashboardPage />;
}

// Root App Component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;