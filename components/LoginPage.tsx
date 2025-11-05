
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { DeliveryTruckIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('teste@portal.com');
  const [password, setPassword] = useState('secret123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await api.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 h-20 w-20 text-indigo-400">
            <DeliveryTruckIcon />
        </div>
        <h1 className="text-4xl font-bold mb-2">HubIntegrou</h1>
        <p className="text-gray-400 mb-8">Gestão de Pedidos Simplificada</p>
        
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
              aria-label="Email"
            />
          </div>
           <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
              aria-label="Password"
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
          >
            {isLoading ? (
                <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>Entrando...</span>
                </>
            ) : (
                'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;