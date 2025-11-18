import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { SalesAnalyticsData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { ChartBarIcon } from './Icons';

type TimePeriod = 'today' | 'week' | 'month';

const KpiCard: React.FC<{ title: string; value: number; colorClass: string }> = ({ title, value, colorClass }) => (
    <div className={`p-4 rounded-lg shadow-sm flex-1 text-center ${colorClass}`}>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
    </div>
);

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<SalesAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const today = new Date();
            let startDate: Date;
            const endDate = new Date(today);

            if (timePeriod === 'today') {
                startDate = new Date(today);
            } else if (timePeriod === 'week') {
                startDate = new Date(today);
                const dayOfWeek = today.getDay();
                const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as first day
                startDate.setDate(diff);
            } else { // month
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            }

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            
            const formatDate = (d: Date) => d.toISOString().split('T')[0];
            
            const fetchedData = await api.getSalesAnalytics(formatDate(startDate), formatDate(endDate));
            setData(fetchedData);
        } catch (err: any) {
            setError(err.message || 'Falha ao carregar análise de vendas.');
        } finally {
            setIsLoading(false);
        }
    }, [timePeriod]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderChart = () => {
        if (!data || data.dailySales.length === 0) {
            return <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">Nenhum dado de venda para o período selecionado.</div>;
        }

        const maxTotal = Math.max(...data.dailySales.map(d => d.total), 0);
        const totalSales = data.dailySales.reduce((sum, day) => sum + day.total, 0);

        const formatLabel = (dateStr: string) => {
             const date = new Date(dateStr + 'T00:00:00');
             if (timePeriod === 'today') return "Hoje";
             if (timePeriod === 'week') return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
             return date.toLocaleDateString('pt-BR', { day: '2-digit' });
        };
        
        return (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border space-y-4">
                <div className="text-center">
                    <p className="text-sm text-gray-500">Total de Vendas Concluídas</p>
                     <p className="text-3xl sm:text-4xl font-bold text-gray-800">
                        {totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
                <div className="flex justify-around items-end h-64 pt-4 px-2 border-t border-gray-200">
                    {data.dailySales.map(day => (
                        <div key={day.date} className="flex flex-col items-center flex-1 group h-full">
                            <div className="relative w-full h-full flex items-end justify-center">
                                <div
                                    className="w-3/5 max-w-xs bg-indigo-300 hover:bg-indigo-500 rounded-t-lg transition-all duration-300"
                                    style={{ height: maxTotal > 0 ? `${(day.total / maxTotal) * 100}%` : '0%' }}
                                >
                                     <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {day.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>
                             <span className="text-xs font-semibold text-gray-600 mt-2 capitalize">{formatLabel(day.date)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-2 sm:p-4 space-y-4">
            <div className="px-2">
                 <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                    <ChartBarIcon className="mr-2 h-5 w-5 text-gray-400" />
                    Análise de Vendas
                </h2>
            </div>

             <div className="flex justify-center bg-gray-100 p-1 rounded-lg">
                {(['today', 'week', 'month'] as const).map(period => (
                    <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className={`flex-1 px-3 py-1.5 text-sm rounded-md font-semibold transition-colors ${timePeriod === period ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        {period === 'today' ? 'Hoje' : period === 'week' ? 'Esta Semana' : 'Este Mês'}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            ) : error ? (
                <div className="h-96 flex items-center justify-center text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <KpiCard title="Confirmados" value={data?.statusCounts.confirmed ?? 0} colorClass="bg-blue-100 text-blue-800" />
                        <KpiCard title="Concluídos" value={data?.statusCounts.completed ?? 0} colorClass="bg-green-100 text-green-800" />
                        <KpiCard title="Cancelados" value={data?.statusCounts.cancelled ?? 0} colorClass="bg-red-100 text-red-800" />
                    </div>
                    {renderChart()}
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
