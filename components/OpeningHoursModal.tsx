import React, { useState, useEffect } from 'react';
import { OpeningHour } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface OpeningHoursModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialHours: OpeningHour[];
    onSaveSuccess: () => void;
}

const weekDays: OpeningHour['dayOfWeek'][] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const dayOfWeekMap: Record<OpeningHour['dayOfWeek'], string> = {
    SUNDAY: 'Domingo',
    MONDAY: 'Segunda',
    TUESDAY: 'Terça',
    WEDNESDAY: 'Quarta',
    THURSDAY: 'Quinta',
    FRIDAY: 'Sexta',
    SATURDAY: 'Sábado',
};

const OpeningHoursModal: React.FC<OpeningHoursModalProps> = ({ isOpen, onClose, initialHours, onSaveSuccess }) => {
    const [hours, setHours] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialData = weekDays.reduce((acc, day) => {
                const existing = initialHours.find(h => h.dayOfWeek === day);
                acc[day] = {
                    start: existing?.start || '09:00',
                    end: existing?.end || '18:00',
                    enabled: !!existing,
                };
                return acc;
            }, {} as Record<string, { start: string; end: string; enabled: boolean }>);
            setHours(initialData);
        }
    }, [isOpen, initialHours]);
    
    const handleToggle = (day: OpeningHour['dayOfWeek']) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled }
        }));
    };

    const handleTimeChange = (day: OpeningHour['dayOfWeek'], type: 'start' | 'end', value: string) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [type]: value }
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // FIX: Refactored to use Object.keys to avoid typing issues with Object.entries,
            // which was causing properties on `val` to be typed as 'unknown'.
            const hoursToSave = Object.keys(hours)
                .filter((day) => hours[day].enabled)
                .map((day) => ({
                    dayOfWeek: day as OpeningHour['dayOfWeek'],
                    start: hours[day].start,
                    end: hours[day].end,
                }));

            await api.updateOpeningHours(hoursToSave);
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || 'Falha ao salvar horários.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <header className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Editar Horários de Funcionamento</h2>
                </header>
                <main className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {weekDays.map(day => (
                        <div key={day} className="flex items-center space-x-4 p-2 rounded-md bg-gray-50">
                            <input
                                type="checkbox"
                                checked={hours[day]?.enabled || false}
                                onChange={() => handleToggle(day)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="w-24 font-medium text-gray-700">{dayOfWeekMap[day]}</span>
                            <input
                                type="time"
                                value={hours[day]?.start || ''}
                                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                disabled={!hours[day]?.enabled}
                                className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm disabled:bg-gray-200 text-gray-900"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="time"
                                value={hours[day]?.end || ''}
                                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                disabled={!hours[day]?.enabled}
                                className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm disabled:bg-gray-200 text-gray-900"
                            />
                        </div>
                    ))}
                </main>
                <footer className="p-4 border-t bg-gray-50 space-y-2">
                     {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                     <div className="flex justify-end space-x-3">
                        <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
                        <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center">
                            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                            Salvar Alterações
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default OpeningHoursModal;