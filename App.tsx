import React, { useState, useCallback } from 'react';
import LoginPage from './components/auth/LoginPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import Dashboard from './components/core/Dashboard';
import { User } from './types';
import { api } from './services/api';
import LoadingSpinner from './components/core/LoadingSpinner';

type AppPage = 'login' | 'forgot-password' | 'dashboard';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState<AppPage>('login');
    const [resetEmail, setResetEmail] = useState('');

    React.useEffect(() => {
        const checkSession = async () => {
            try {
                const currentUser = await api.getMe();
                setUser(currentUser);
                setCurrentPage('dashboard');
            } catch (error) {
                setUser(null);
                setCurrentPage('login');
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleLogin = useCallback((loggedInUser: User) => {
        setUser(loggedInUser);
        setCurrentPage('dashboard');
    }, []);

    const handleLogout = useCallback(() => {
        api.logout();
        setUser(null);
        setCurrentPage('login');
    }, []);

    const handleForgotPassword = useCallback(() => {
        setCurrentPage('forgot-password');
    }, []);

    const handleBackToLogin = useCallback(() => {
        setCurrentPage('login');
    }, []);

    const handleResetPassword = useCallback((email: string) => {
        setResetEmail(email);
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

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return user ? <Dashboard user={user} onLogout={handleLogout} /> : null;

            case 'forgot-password':
                return (
                    <ForgotPasswordPage
                        onBackToLogin={handleBackToLogin}
                        onResetPassword={handleResetPassword}
                    />
                );

            case 'login':
            default:
                return (
                    <LoginPage
                        onLogin={handleLogin}
                        onForgotPassword={handleForgotPassword}
                    />
                );
        }
    };

    return (
        <div className="h-screen w-screen font-sans bg-gray-50">
            {renderPage()}
        </div>
    );
};

export default App;