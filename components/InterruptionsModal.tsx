import React, { useState } from 'react';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface InterruptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
}

const InterruptionsModal: React.FC<InterruptionsModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
    const [description, setDescription] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const resetState = () => {
        setDescription('');
        setStart('');
        setEnd('');
        setError(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!description || !start || !end) {
            setError('Todos os campos são obrigatórios.');
            return;
        }
        if (new Date(start) >= new Date(end)) {
            setError('A data de início deve ser anterior à data de fim.');
            return;
        }

        setIsLoading(true);
        try {
            await api.createInterruption({
                description,
                start: new Date(start).toISOString(),
                end: new Date(end).toISOString(),
            });
            resetState();
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || 'Falha ao agendar interrupção.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Agendar Nova Interrupção</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold" disabled={isLoading}>×</button>
                </header>
                <form onSubmit={handleSave}>
                    <main className="p-4 space-y-4">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                            <input
                                type="text"
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Feriado, Manutenção"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                <input
                                    type="datetime-local"
                                    id="start"
                                    value={start}
                                    onChange={(e) => setStart(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                                <input
                                    type="datetime-local"
                                    id="end"
                                    value={end}
                                    onChange={(e) => setEnd(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                    </main>
                    <footer className="p-4 border-t bg-gray-50 space-y-2">
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center">
                                {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                                Salvar Agendamento
                            </button>
                        </div>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default InterruptionsModal;
