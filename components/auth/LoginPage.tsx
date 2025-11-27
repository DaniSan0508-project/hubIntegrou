import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';
import { DeliveryTruckIcon } from '../core/Icons';
import LoadingSpinner from '../core/LoadingSpinner';

interface LoginPageProps {
    onLogin: (user: User) => void;
    onForgotPassword?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onForgotPassword }) => {
    const [email, setEmail] = useState('teste@portal.com');
    const [password, setPassword] = useState('secret123');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [cnpj, setCnpj] = useState('');
    const [name, setName] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isRegisterMode) {
            const cleanCnpj = cnpj.replace(/\D/g, '');

            if (!cleanCnpj || !name.trim() || !email.trim() || !password.trim() || !passwordConfirmation.trim()) {
                setError('Por favor, preencha todos os campos.');
                return;
            }

            if (cleanCnpj.length !== 14) {
                setError('CNPJ deve ter 14 dígitos.');
                return;
            }

            if (password !== passwordConfirmation) {
                setError('As senhas não coincidem.');
                return;
            }
        } else {
            if (!email.trim() || !password.trim()) {
                setError('Por favor, preencha o e-mail e a senha.');
                return;
            }
        }

        setIsLoading(true);
        try {
            if (isRegisterMode) {
                const cleanCnpj = cnpj.replace(/\D/g, '');

                const result = await api.registerPortalUser({
                    cnpj: cleanCnpj,
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation
                });

                const user = await api.login(email, password, rememberMe);
                onLogin(user);
            } else {
                const user = await api.login(email, password, rememberMe);
                onLogin(user);
            }
        } catch (err: any) {
            if (err.message && err.message.includes('Failed to fetch')) {
                setError('Falha na conexão. Verifique sua internet e tente novamente.');
            } else if (err.message && err.message.toLowerCase().includes('cnpj não encontrado')) {
                setError('CNPJ não encontrado. Verifique o número ou entre em contato com o suporte.');
            } else if (err.message && err.message.toLowerCase().includes('já existe um usuário')) {
                setError('Já existe um usuário com este email. Faça login ou use outro email.');
            } else if (err.message && (err.message.toLowerCase().includes('credenciais inválidas') || err.message.toLowerCase().includes('invalid credentials'))) {
                setError('E-mail ou senha incorretos. Por favor, verifique seus dados.');
            } else {
                setError(err.message || 'Ocorreu um erro inesperado. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError(null);
        if (isRegisterMode) {
            setCnpj('');
            setName('');
            setPasswordConfirmation('');
        }
    };

    const formatCnpj = (value: string) => {
        const numbers = value.replace(/\D/g, '');

        if (numbers.length <= 2) {
            return numbers;
        } else if (numbers.length <= 5) {
            return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
        } else if (numbers.length <= 8) {
            return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
        } else if (numbers.length <= 12) {
            return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
        } else {
            return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
        }
    };

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedCnpj = formatCnpj(e.target.value);
        setCnpj(formattedCnpj);
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
                    {isRegisterMode && (
                        <>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={cnpj}
                                    onChange={handleCnpjChange}
                                    placeholder="CNPJ da empresa"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                                    aria-label="CNPJ"
                                    maxLength={18}
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome completo"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                                    aria-label="Nome completo"
                                />
                            </div>
                        </>
                    )}

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

                    <div className="mb-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isRegisterMode ? "Senha (mínimo 8 caracteres)" : "Senha"}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                            aria-label="Password"
                        />
                    </div>

                    {isRegisterMode && (
                        <div className="mb-4">
                            <input
                                type="password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                placeholder="Confirme sua senha"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                                aria-label="Confirmar senha"
                            />
                        </div>
                    )}

                    {!isRegisterMode && (
                        <div className="mb-6 flex items-center">
                            <label className="flex items-center text-sm text-gray-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 select-none">Mantenha-me conectado</span>
                            </label>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center mb-4"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                <span>{isRegisterMode ? 'Registrando...' : 'Entrando...'}</span>
                            </>
                        ) : (
                            isRegisterMode ? 'Registrar' : 'Entrar'
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition duration-200"
                        >
                            {isRegisterMode
                                ? 'Já tem uma conta? Faça login'
                                : 'Não tem uma conta? Registre-se'}
                        </button>
                    </div>

                    {!isRegisterMode && onForgotPassword && (
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition duration-200"
                            >
                                Esqueceu sua senha?
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default LoginPage;