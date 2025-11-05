import React, { useState, useEffect, useCallback } from 'react';
import { StoreStatus, OpeningHour, Interruption } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import OpeningHoursModal from './OpeningHoursModal';
import InterruptionsModal from './InterruptionsModal';
import { RefreshIcon, StoreIcon, ClockIcon, CalendarIcon, EditIcon, WarningIcon, PlusCircleIcon, TrashIcon } from './Icons';

const dayOfWeekMap: Record<OpeningHour['dayOfWeek'], string> = {
    SUNDAY: 'Domingo',
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
};

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', ' -');
};

const StorePage: React.FC = () => {
    const [status, setStatus] = useState<StoreStatus | null>(null);
    const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
    const [interruptions, setInterruptions] = useState<Interruption[]>([]);
    const [isLoading, setIsLoading] = useState({ status: true, hours: true, interruptions: true });
    const [error, setError] = useState<string | null>(null);
    
    const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
    const [isInterruptionsModalOpen, setIsInterruptionsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading({ status: true, hours: true, interruptions: true });
        setError(null);
        try {
            const [statusRes, hoursRes, interruptionsRes] = await Promise.all([
                api.getStoreStatus().finally(() => setIsLoading(prev => ({ ...prev, status: false }))),
                api.getOpeningHours().finally(() => setIsLoading(prev => ({ ...prev, hours: false }))),
                api.getInterruptions().finally(() => setIsLoading(prev => ({ ...prev, interruptions: false }))),
            ]);
            setStatus(statusRes);
            setOpeningHours(hoursRes);
            setInterruptions(interruptionsRes);
        } catch (err: any) {
            setError(err.message || 'Falha ao carregar dados da loja.');
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteInterruption = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover esta interrupção?')) return;
        try {
            await api.deleteInterruption(id);
            setInterruptions(prev => prev.filter(i => i.id !== id));
        } catch (err: any) {
            alert(`Erro ao remover interrupção: ${err.message}`);
        }
    };

    const sortedOpeningHours = [...openingHours].sort((a, b) => {
        const order = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
    });

    const statusMap = {
        OK: { text: 'Online', color: 'bg-green-100 text-green-800', icon: <StoreIcon className="text-green-600" /> },
        WARNING: { text: 'Alerta', color: 'bg-yellow-100 text-yellow-800', icon: <WarningIcon className="text-yellow-600" /> },
        ERROR: { text: 'Offline', color: 'bg-red-100 text-red-800', icon: <StoreIcon className="text-red-600" /> },
    };

    return (
        <div className="p-2 sm:p-4 space-y-4">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-lg font-semibold text-gray-700">Gerenciamento da Loja</h2>
                <button onClick={fetchData} className="text-gray-500 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" aria-label="Atualizar dados da loja">
                    <RefreshIcon className={Object.values(isLoading).some(Boolean) ? 'animate-spin' : ''} />
                </button>
            </div>
            
            {error && <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>}

            {/* Status Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                       Status da Loja (iFood)
                    </h3>
                    {isLoading.status ? <LoadingSpinner size="sm" /> : status && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusMap[status.state].color}`}>
                            {statusMap[status.state].text}
                        </span>
                    )}
                </div>
                {isLoading.status ? <div className="text-center py-4 text-gray-500">Carregando...</div> : status ? (
                    <div>
                        {status.problems.length > 0 && (
                            <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                                <h4 className="font-semibold text-yellow-800">Problemas Detectados:</h4>
                                <ul className="list-disc list-inside text-sm text-yellow-700">
                                    {status.problems.map((p, i) => <li key={i}>{p.description}</li>)}
                                </ul>
                            </div>
                        )}
                         {status.problems.length === 0 && status.state === 'OK' && (
                            <p className="text-sm text-gray-600 mt-2">Nenhum problema detectado. A loja está operando normalmente no iFood.</p>
                        )}
                    </div>
                ) : <p className="text-center py-4 text-gray-500">Não foi possível carregar o status.</p>}
            </div>

            {/* Opening Hours Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700 flex items-center"><ClockIcon className="mr-2" /> Horários de Funcionamento</h3>
                    <button onClick={() => setIsHoursModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 text-sm font-semibold flex items-center">
                        <EditIcon className="mr-1" /> Editar
                    </button>
                </div>
                 {isLoading.hours ? <div className="text-center py-4 text-gray-500">Carregando...</div> : sortedOpeningHours.length > 0 ? (
                    <ul className="space-y-2 mt-3">
                        {sortedOpeningHours.map(h => (
                             <li key={h.dayOfWeek} className="flex justify-between items-center p-2 bg-gray-50 rounded-md text-sm">
                                <span className="font-medium text-gray-800">{dayOfWeekMap[h.dayOfWeek]}</span>
                                <span className="text-gray-600">{h.start} - {h.end}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-center py-4 text-gray-500">Nenhum horário de funcionamento definido.</p>}
            </div>

            {/* Interruptions Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700 flex items-center"><CalendarIcon className="mr-2" /> Interrupções Agendadas</h3>
                     <button onClick={() => setIsInterruptionsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-lg text-sm flex items-center">
                        <PlusCircleIcon className="mr-1 h-5 w-5"/> Agendar Nova
                    </button>
                </div>
                 {isLoading.interruptions ? <div className="text-center py-4 text-gray-500">Carregando...</div> : interruptions.length > 0 ? (
                    <ul className="space-y-2 mt-3">
                        {interruptions.map(i => (
                             <li key={i.id} className="p-3 bg-red-50 rounded-md text-sm border-l-4 border-red-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-red-800">{i.description}</p>
                                        <p className="text-red-700">
                                            <span className="font-medium">De:</span> {formatDateTime(i.start)} <br/>
                                            <span className="font-medium">Até:</span> {formatDateTime(i.end)}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDeleteInterruption(i.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-center py-4 text-gray-500">Nenhuma interrupção agendada.</p>}
            </div>

            <OpeningHoursModal
                isOpen={isHoursModalOpen}
                onClose={() => setIsHoursModalOpen(false)}
                initialHours={openingHours}
                onSaveSuccess={() => {
                    setIsHoursModalOpen(false);
                    fetchData(); // Refresh data on success
                }}
            />
            
            <InterruptionsModal
                isOpen={isInterruptionsModalOpen}
                onClose={() => setIsInterruptionsModalOpen(false)}
                onSaveSuccess={() => {
                    setIsInterruptionsModalOpen(false);
                    fetchData(); // Refresh data on success
                }}
            />
        </div>
    );
};

export default StorePage;
