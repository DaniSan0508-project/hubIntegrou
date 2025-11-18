import React, { useState, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { User } from './types';
import { api } from './services/api';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Check for an existing session via stored token
    const checkSession = async () => {
      try {
        // api.getMe will automatically use the stored token.
        // If it fails (no token/invalid token), it will throw an error.
        const currentUser = await api.getMe();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
  }, []);

  const handleLogout = useCallback(() => {
    api.logout(); // Clears the token from localStorage
    setUser(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4">HubIntegrou</h1>
            <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen font-sans bg-gray-50">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
