// client/src/App.tsx

import { SurveyProvider } from './contexts/SurveyContext';
import { useSurvey } from './contexts/SurveyContext';

import ProfilingPage from './pages/ProfilingPage';
import QuizPage from './pages/QuizPage';
import EvaluationPage from './pages/EvaluationPage';
import ThankYouPage from './pages/ThankYouPage';

function AppContent() {
  const { currentPage } = useSurvey();

  switch (currentPage) {
    case 'profiling':
      return <ProfilingPage />;
    case 'quiz':
      return <QuizPage />;
    case 'evaluation':
      return <EvaluationPage />;
    case 'thank-you':
      return <ThankYouPage />;
    default:
      return <ProfilingPage />;
  }
}

function App() {
  return (
    <SurveyProvider>
      <AppContent />
    </SurveyProvider>
  );
}

export default App;