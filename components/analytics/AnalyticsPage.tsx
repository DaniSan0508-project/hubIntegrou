
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { SalesAnalyticsData, DailyMetric } from '../../types';
import LoadingSpinner from '../core/LoadingSpinner';
import { ChartBarIcon } from '../core/Icons';

type TimePeriod = 'today' | 'week' | 'month';

const KpiCard: React.FC<{ title: string; value: number; colorClass: string }> = ({ title, value, colorClass }) => (
    <div className={`p-4 rounded-lg shadow-sm flex-1 text-center ${colorClass}`}>
        <p className="text-xs sm:text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold">{value}</p>
    </div>
);

interface BarChartProps {
    title: string;
    data: DailyMetric[];
    dataKey: keyof DailyMetric;
    colorClass: string; // e.g., 'bg-blue-500'
    hoverColorClass: string; // e.g., 'hover:bg-blue-600'
    barBgClass: string; // e.g., 'bg-blue-100' (for the container bar if needed, unused in this design but good for ref)
    formatValue: (val: number) => string;
    timePeriod: TimePeriod;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, dataKey, colorClass, hoverColorClass, formatValue, timePeriod }) => {
    if (!data || data.length === 0) {
        return <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-100 text-sm">Sem dados para {title}</div>;
    }

    const values = data.map(d => Number(d[dataKey]));
    const maxVal = Math.max(...values, 0);
    const totalVal = values.reduce((a, b) => a + b, 0);

    const formatLabel = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        if (timePeriod === 'today') return "Hoje";
        if (timePeriod === 'week') return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        return date.toLocaleDateString('pt-BR', { day: '2-digit' });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-2">
            <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
                <span className="text-lg font-bold text-gray-800">{formatValue(totalVal)}</span>
            </div>

            <div className="flex justify-around items-end h-32 pt-4 px-1 border-t border-gray-100">
                {data.map(day => {
                    const val = Number(day[dataKey]);
                    const heightPercent = maxVal > 0 ? (val / maxVal) * 100 : 0;

                    return (
                        <div key={day.date} className="flex flex-col items-center flex-1 group h-full">
                            <div className="relative w-full h-full flex items-end justify-center">
                                <div
                                    className={`w-3/5 max-w-[20px] sm:max-w-[30px] rounded-t-sm transition-all duration-500 ${colorClass} ${hoverColorClass}`}
                                    style={{ height: `${heightPercent}%` }}
                                >
                                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {formatValue(val)}
                                    </span>
                                </div>
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 mt-1 capitalize truncate w-full text-center">{formatLabel(day.date)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

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

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatNumber = (val: number) => val.toString();

    return (
        <div className="p-2 sm:p-4 space-y-4">
            <div className="px-2">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                    <ChartBarIcon className="mr-2 h-5 w-5 text-gray-400" />
                    Análise de Vendas
                </h2>
            </div>

            <div className="flex justify-center bg-gray-100 p-1 rounded-lg mx-2">
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
                <div className="h-64 flex items-center justify-center text-red-500 bg-red-50 p-4 rounded-lg mx-2">{error}</div>
            ) : (
                <div className="space-y-6 pb-8">
                    {/* KPI Cards */}
                    <div className="flex flex-row gap-3 overflow-x-auto pb-2 px-2">
                        <KpiCard title="Confirmados" value={data?.statusCounts.confirmed ?? 0} colorClass="bg-blue-100 text-blue-800" />
                        <KpiCard title="Concluídos" value={data?.statusCounts.completed ?? 0} colorClass="bg-green-100 text-green-800" />
                        <KpiCard title="Cancelados" value={data?.statusCounts.cancelled ?? 0} colorClass="bg-red-100 text-red-800" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                        {/* 1. Total Sales Value (Financial) */}
                        <BarChart
                            title="Faturamento (R$)"
                            data={data?.dailyMetrics || []}
                            dataKey="totalValue"
                            colorClass="bg-emerald-400"
                            hoverColorClass="group-hover:bg-emerald-500"
                            barBgClass=""
                            formatValue={formatCurrency}
                            timePeriod={timePeriod}
                        />

                        {/* 2. Confirmed Orders Count */}
                        <BarChart
                            title="Pedidos Confirmados (Qtd)"
                            data={data?.dailyMetrics || []}
                            dataKey="countConfirmed"
                            colorClass="bg-blue-400"
                            hoverColorClass="group-hover:bg-blue-500"
                            barBgClass=""
                            formatValue={formatNumber}
                            timePeriod={timePeriod}
                        />

                        {/* 3. Completed Orders Count */}
                        <BarChart
                            title="Pedidos Concluídos (Qtd)"
                            data={data?.dailyMetrics || []}
                            dataKey="countCompleted"
                            colorClass="bg-teal-400"
                            hoverColorClass="group-hover:bg-teal-500"
                            barBgClass=""
                            formatValue={formatNumber}
                            timePeriod={timePeriod}
                        />

                        {/* 4. Cancelled Orders Count */}
                        <BarChart
                            title="Pedidos Cancelados (Qtd)"
                            data={data?.dailyMetrics || []}
                            dataKey="countCancelled"
                            colorClass="bg-red-400"
                            hoverColorClass="group-hover:bg-red-500"
                            barBgClass=""
                            formatValue={formatNumber}
                            timePeriod={timePeriod}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;