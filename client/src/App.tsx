import { LearningProvider, useLearning } from './contexts/LearningContext';
import { ProfileSelector } from './components/ProfileSelector';
import { QuestionCard } from './components/QuestionCard';
import './index.css';

function AppContent() {
  const { state } = useLearning();

  if (!state.profile) {
    return <ProfileSelector />;
  }

  return <QuestionCard />;
}

function App() {
  return (
    <LearningProvider>
      <AppContent />
    </LearningProvider>
  );
}

export default App;
