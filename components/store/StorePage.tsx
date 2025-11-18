
import React, { useState, useEffect, useCallback } from 'react';
import { StoreStatus, OpeningHour, Interruption, User } from '../../types';
import { api } from '../../services/api';
import LoadingSpinner from '../core/LoadingSpinner';
import OpeningHoursModal from './OpeningHoursModal';
import InterruptionsModal from './InterruptionsModal';
import { RefreshIcon, ClockIcon, CalendarIcon, EditIcon, PlusCircleIcon, TrashIcon } from '../core/Icons';

interface StorePageProps {
    user: User;
}

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

const StorePage: React.FC<StorePageProps> = ({ user }) => {
    const [status, setStatus] = useState<StoreStatus | null>(null);
    const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
    const [interruptions, setInterruptions] = useState<Interruption[]>([]);
    const [isLoading, setIsLoading] = useState({ status: true, hours: true, interruptions: true });
    const [error, setError] = useState<string | null>(null);
    
    const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
    const [isInterruptionsModalOpen, setIsInterruptionsModalOpen] = useState(false);

    const hasIfoodIntegration = user.integrations?.providers.includes('ifood');

    const fetchData = useCallback(async () => {
        if (!hasIfoodIntegration) {
            setIsLoading({ status: false, hours: false, interruptions: false });
            return;
        }

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
    }, [hasIfoodIntegration]);

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
        OK: { text: 'Online', color: 'bg-green-100 text-green-800' },
        WARNING: { text: 'Alerta', color: 'bg-yellow-100 text-yellow-800' },
        ERROR: { text: 'Offline', color: 'bg-red-100 text-red-800' },
    };

    return (
        <div className="p-2 sm:p-4 space-y-4">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-lg font-semibold text-gray-700">Gerenciamento de Integrações</h2>
                {hasIfoodIntegration && (
                    <button onClick={fetchData} className="text-gray-500 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" aria-label="Atualizar dados da loja">
                        <RefreshIcon className={Object.values(isLoading).some(Boolean) ? 'animate-spin' : ''} />
                    </button>
                )}
            </div>
            
            {error && <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>}

            {hasIfoodIntegration ? (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                    {/* iFood Card Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                        <div className="flex items-center">
                             <h3 className="font-bold text-xl text-red-800 mr-4">iFood</h3>
                             <div>
                                <p className="text-sm text-gray-500 truncate">{user.tenant.name}</p>
                            </div>
                        </div>
                        {isLoading.status ? <LoadingSpinner size="sm" /> : status && (
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusMap[status.state].color}`}>
                                {statusMap[status.state].text}
                            </span>
                        )}
                    </div>

                    {/* iFood Card Body */}
                    <div className="space-y-6">
                        {/* Status Details Section */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Status da Integração</h4>
                            {isLoading.status ? <p className="text-sm text-gray-500">Carregando status...</p> : status ? (
                                <div>
                                    {status.problems.length > 0 ? (
                                        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
                                            <h5 className="font-semibold text-yellow-800">Problemas Detectados:</h5>
                                            <ul className="list-disc list-inside text-sm text-yellow-700">
                                                {status.problems.map((p, i) => <li key={i}>{p.description}</li>)}
                                            </ul>
                                        </div>
                                    ) : status.state === 'OK' && (
                                        <p className="text-sm text-gray-600">Nenhum problema detectado. A loja está operando normalmente no iFood.</p>
                                    )}
                                </div>
                            ) : <p className="text-sm text-gray-500">Não foi possível carregar o status.</p>}
                        </div>

                        {/* Opening Hours Section */}
                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-gray-700 flex items-center"><ClockIcon className="mr-2 text-gray-400" /> Horários de Funcionamento</h4>
                                <button onClick={() => setIsHoursModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 text-sm font-semibold flex items-center">
                                    <EditIcon className="mr-1 h-4 w-4" /> Editar
                                </button>
                            </div>
                             {isLoading.hours ? <p className="text-sm text-gray-500 text-center py-4">Carregando...</p> : sortedOpeningHours.length > 0 ? (
                                <ul className="space-y-2 mt-3">
                                    {sortedOpeningHours.map(h => (
                                         <li key={h.dayOfWeek} className="flex justify-between items-center p-2 bg-gray-50 rounded-md text-sm">
                                            <span className="font-medium text-gray-800">{dayOfWeekMap[h.dayOfWeek]}</span>
                                            <span className="text-gray-600 font-mono">{h.start} - {h.end}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-center py-4 text-gray-500">Nenhum horário definido.</p>}
                        </div>

                        {/* Interruptions Section */}
                        <div className="border-t pt-6">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-gray-700 flex items-center"><CalendarIcon className="mr-2 text-gray-400" /> Interrupções Agendadas</h4>
                                 <button onClick={() => setIsInterruptionsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-lg text-sm flex items-center">
                                    <PlusCircleIcon className="mr-1 h-5 w-5"/> Agendar Nova
                                </button>
                            </div>
                             {isLoading.interruptions ? <p className="text-sm text-gray-500 text-center py-4">Carregando...</p> : interruptions.length > 0 ? (
                                <ul className="space-y-2 mt-3">
                                    {interruptions.map(i => (
                                         <li key={i.id} className="p-3 bg-red-50 rounded-md text-sm border-l-4 border-red-300">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-red-800">{i.description}</p>
                                                    <p className="text-red-700 font-mono text-xs">
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
                    </div>
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500">Nenhuma integração iFood encontrada para esta loja.</p>
                </div>
            )}
            
            {hasIfoodIntegration && (
                <>
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
                </>
            )}
        </div>
    );
};

export default StorePage;
