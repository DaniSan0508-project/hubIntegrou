import React, { useState } from 'react';
import { DeliveryTruckIcon } from '../core/Icons';
import { api } from '../../services/api';
import LoadingSpinner from '../core/LoadingSpinner';

interface ForgotPasswordPageProps {
    onBackToLogin: () => void;
    onResetPassword: (email: string) => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
    onBackToLogin,
    onResetPassword
}) => {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email.trim()) {
            setError('Por favor, informe seu e-mail.');
            return;
        }

        setIsLoading(true);
        try {
            await api.requestPasswordReset(email);
            setSuccess('Instruções para redefinição de senha foram enviadas para seu e-mail.');
            onResetPassword(email);
        } catch (err: any) {
            if (err.message && err.message.includes('Failed to fetch')) {
                setError('Falha na conexão. Verifique sua internet e tente novamente.');
            } else {
                setError(err.message || 'Ocorreu um erro ao solicitar a redefinição. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!resetToken.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        try {
            await api.resetPassword(resetToken, email, newPassword, confirmPassword);
            setSuccess('Senha redefinida com sucesso! Redirecionando para o login...');
            setTimeout(() => {
                onBackToLogin();
            }, 2000);
        } catch (err: any) {
            if (err.message && err.message.includes('Failed to fetch')) {
                setError('Falha na conexão. Verifique sua internet e tente novamente.');
            } else if (err.message && err.message.toLowerCase().includes('token')) {
                setError('Token inválido ou expirado. Solicite um novo link de redefinição.');
            } else {
                setError(err.message || 'Ocorreu um erro ao redefinir a senha. Tente novamente.');
            }
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
                <p className="text-gray-400 mb-8">Recuperação de Senha</p>

                {step === 'request' ? (
                    <form onSubmit={handleRequestReset} className="w-full">
                        <div className="mb-4">
                            <p className="text-gray-300 text-sm mb-4 text-left">
                                Informe seu e-mail para receber as instruções de redefinição de senha.
                            </p>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                                aria-label="Email"
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm mb-4 text-left">{error}</p>}
                        {success && <p className="text-green-400 text-sm mb-4 text-left">{success}</p>}

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    'Enviar Instruções'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onBackToLogin}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out"
                            >
                                Voltar para Login
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="w-full">
                        <div className="mb-4">
                            <p className="text-gray-300 text-sm mb-4 text-left">
                                Insira o token recebido por e-mail e sua nova senha.
                            </p>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={resetToken}
                                    onChange={(e) => setResetToken(e.target.value)}
                                    placeholder="Token de redefinição"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                                    aria-label="Token de redefinição"
                                />
                            </div>

                            <div className="mb-4">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nova senha"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                                    aria-label="Nova senha"
                                />
                            </div>

                            <div className="mb-4">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirmar nova senha"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-gray-400"
                                    aria-label="Confirmar nova senha"
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm mb-4 text-left">{error}</p>}
                        {success && <p className="text-green-400 text-sm mb-4 text-left">{success}</p>}

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        <span>Redefinindo...</span>
                                    </>
                                ) : (
                                    'Redefinir Senha'
                                )}
                            </button>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('request')}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out"
                                >
                                    Voltar
                                </button>

                                <button
                                    type="button"
                                    onClick={onBackToLogin}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out"
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;