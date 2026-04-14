// client/src/App.tsx
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PracticePage from './pages/PracticePage';

function App() {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Get current path
  const path = window.location.pathname;

  console.log('🔍 Current path:', path);
  console.log('👤 User:', user ? user.email : 'Not logged in');

  // Public routes
  if (path === '/register') {
    return user ? <DashboardPage /> : <RegisterPage />;
  }

  if (path === '/login' || path === '/') {
    return user ? <DashboardPage /> : <LoginPage />;
  }

  // Protected routes - require authentication
  if (!user) {
    console.log('⚠️ No user, redirecting to login');
    window.location.href = '/login';
    return null;
  }

  // Practice route
  if (path === '/practice') {
    console.log('✅ Rendering PracticePage');
    return <PracticePage />;
  }

  // Dashboard route (default for authenticated users)
  console.log('✅ Rendering DashboardPage');
  return <DashboardPage />;
}

export default App;