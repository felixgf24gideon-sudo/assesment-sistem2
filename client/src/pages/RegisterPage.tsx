// client/src/pages/RegisterPage.tsx
import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PROFILE_CODES = [
  '1TGI', '1TGR', '1TAI', '1TAR', '1PGI', '1PGR', '1PAI', '1PAR',
  '2TGI', '2TGR', '2TAI', '2TAR', '2PGI', '2PGR', '2PAI', '2PAR',
  '3TGI', '3TGR', '3TAI', '3TAR', '3PGI', '3PGR', '3PAI', '3PAR',
  '4TGI', '4TGR', '4TAI', '4TAR', '4PGI', '4PGR', '4PAI', '4PAR',
  '5TGI', '5TGR', '5TAI', '5TAR', '5PGI', '5PGR', '5PAI', '5PAR',
  '6TGI', '6TGR', '6TAI', '6TAR', '6PGI', '6PGR', '6PAI', '6PAR',
];

export default function RegisterPage() {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile_code: '3TGI',
  });
  const [validationError, setValidationError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setValidationError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        profile_code: formData.profile_code,
      });
      // Redirect will happen via auth state change
    } catch (err) {
      console.error('Registration failed:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join the research study
          </p>
        </div>

        {/* Error Messages */}
        {(error || validationError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ❌ {error || validationError}
            </p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>

          {/* Profile Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cognitive Profile Code
            </label>
            <select
              name="profile_code"
              value={formData.profile_code}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            >
              {PROFILE_CODES.map(code => (
                <option key={code} value={code}>
                  {code} - Level {code[0]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Format: Level (1-6) + Visual (T/P) + Processing (G/A) + Tempo (I/R)
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:underline font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}