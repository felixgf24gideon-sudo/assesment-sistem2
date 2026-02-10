import { LoadingSpinner } from './LoadingSpinner';

interface FeedbackPanelProps {
  state: 'neutral' | 'incorrect' | 'correct';
  feedback: string;
  isLoading: boolean;
}

export function FeedbackPanel({ state, feedback, isLoading }: FeedbackPanelProps) {
  if (state === 'neutral' && !isLoading) {
    return null;
  }

  const getBorderColor = () => {
    if (state === 'correct') return 'border-green-600';
    if (state === 'incorrect') return 'border-red-600';
    return 'border-gray-300';
  };

  const getBackgroundColor = () => {
    if (state === 'correct') return 'bg-green-50';
    if (state === 'incorrect') return 'bg-red-50';
    return 'bg-gray-50';
  };

  const getIcon = () => {
    if (state === 'correct') {
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (state === 'incorrect') {
      return (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={`mt-6 p-6 rounded-lg border-2 ${getBorderColor()} ${getBackgroundColor()}`}>
      {isLoading ? (
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-3 text-gray-600">Generating feedback...</p>
        </div>
      ) : (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="text-gray-800 leading-relaxed">{feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}
