import { useState } from 'react';
import { useLearning } from '../contexts/LearningContext';
import { parseProfileCode } from '../utils/profileParser';
import { validateProfileCode } from '../utils/validators';

export function ProfileSelector() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const { dispatch } = useLearning();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = input.toUpperCase().trim();
    
    if (!validateProfileCode(code)) {
      setError('Invalid profile code. Format: digit (1-6) + three letters (T/P, G/A, I/R). Example: 2TGI');
      return;
    }

    const profile = parseProfileCode(code);
    if (profile) {
      dispatch({ type: 'SET_PROFILE', payload: profile });
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Adaptive Practice System</h1>
        <p className="text-gray-600 mb-6">Enter your student profile code to begin</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="profileCode" className="block text-sm font-medium text-gray-700 mb-2">
              Profile Code
            </label>
            <input
              type="text"
              id="profileCode"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., 2TGI, 5PAR"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              maxLength={4}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Learning
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Profile Code Format:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Level: 1-6 (beginner to expert)</li>
            <li>• Visual: T (Text) or P (Pictures)</li>
            <li>• Processing: G (Global) or A (Analytic)</li>
            <li>• Tempo: I (Impulsive) or R (Reflective)</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">Examples: 1TGI, 3PAR, 5AGI, 6PGR</p>
        </div>
      </div>
    </div>
  );
}
