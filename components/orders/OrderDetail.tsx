
import React, { useState, useEffect, useCallback } from 'react';
import { Order } from '../../types';
import { api } from '../../services/api';
import StatusBadge from '../core/StatusBadge';
import { NEXT_ACTION_MAP } from '../../constants';
import { BackIcon, UserIcon, MapPinIcon, CreditCardIcon, QrCodeIcon, ClipboardIcon, CalendarIcon, DollarSignIcon } from '../core/Icons';
import LoadingSpinner from '../core/LoadingSpinner';

interface OrderDetailProps {
    orderId: string;
    onBack: () => void;
}

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
        return dateString; // Fallback for invalid dates
    }
    // Format: DD/MM/YYYY HH:mm
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(',', '');
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
        return '';
    }
    // Format: HH:mm
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const Toast: React.FC<{ message: string; isVisible: boolean }> = ({ message, isVisible }) => (
    <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white rounded-lg shadow-lg transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
            }`}
    >
        {message}
    </div>
);

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack }) => {
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const fetchOrder = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedOrder = await api.getOrderById(orderId);
            setOrder(fetchedOrder);
        } catch (err) {
            setError('Falha ao carregar detalhes do pedido.');
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handleAction = async () => {
        if (!order) return;
        const action = NEXT_ACTION_MAP[order.status];
        if (!action) return;

        setIsActionLoading(true);
        try {
            const nextStatus = action.nextStatus;
            await api.updateOrderStatus(order, nextStatus);
            setOrder(prevOrder => prevOrder ? { ...prevOrder, status: nextStatus } : null);
        } catch (err: any) {
            setError(err.message || "Falha ao atualizar o status do pedido.");
        } finally {
            setIsActionLoading(false);
        }
    }

    const handleDeliveryCodeClick = () => {
        if (order?.deliveryCode) {
            navigator.clipboard.writeText(order.deliveryCode).then(() => {
                setToastMessage('Código copiado para a área de transferência!');
                window.open('https://confirmacao-entrega-propria.ifood.com.br/', '_blank', 'noopener,noreferrer');
                setTimeout(() => setToastMessage(null), 3000);
            }).catch(err => {
                console.error('Falha ao copiar:', err);
                setToastMessage('Falha ao copiar o código.');
                setTimeout(() => setToastMessage(null), 3000);
            });
        }
    };


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-center text-gray-500">Carregando detalhes...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="p-4 text-center text-red-500">
                <p>{error || 'Pedido não encontrado.'}</p>
                <button onClick={onBack} className="mt-4 text-indigo-600">Voltar</button>
            </div>
        );
    }

    const nextAction = NEXT_ACTION_MAP[order.status];
    const hasCosts = order.subtotal !== undefined || (order.deliveryFee !== undefined && order.deliveryFee > 0) || (order.otherFees && order.otherFees.length > 0);
    const otherFeesTotal = order.otherFees?.reduce((acc, fee) => acc + fee.amount, 0) || 0;

    return (
        <div className="bg-gray-50 min-h-full">
            <Toast message={toastMessage || ''} isVisible={!!toastMessage} />
            <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                    <BackIcon />
                </button>
                <div>
                    <h2 className="font-bold text-lg text-gray-800">{order.displayId}</h2>
                    <StatusBadge order={order} />
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><UserIcon className="mr-2 h-4 w-4" /> Cliente e Entrega</h3>
                    <p className="font-bold text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-600 flex items-start"><MapPinIcon className="mr-2 mt-1 flex-shrink-0 h-4 w-4" /> {order.deliveryAddress}</p>
                </div>

                {order.isScheduled && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><CalendarIcon className="mr-2 h-5 w-5 text-gray-400" /> Agendamento</h3>
                        <div className="space-y-2 text-sm">
                            {order.deliveryWindow && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Janela de Entrega:</span>
                                    <span className="font-medium text-gray-800 text-right">{formatDateTime(order.deliveryWindow.start)} - {formatTime(order.deliveryWindow.end)}</span>
                                </div>
                            )}
                            {order.preparationStartTime && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Iniciar Preparo:</span>
                                    <span className="font-medium text-gray-800">{formatDateTime(order.preparationStartTime)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {(order.deliveryCode || order.pickupCode) && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><QrCodeIcon className="mr-2 h-5 w-5 text-gray-400" /> Códigos de Entrega</h3>
                        {order.deliveryCode && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Código de Entrega:</span>
                                <button
                                    onClick={handleDeliveryCodeClick}
                                    className="font-bold font-mono text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5 p-1 -m-1 rounded-md"
                                    title="Copiar código e abrir página de confirmação"
                                >
                                    <span>{order.deliveryCode}</span>
                                    <ClipboardIcon className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {order.pickupCode && (
                            <div className="flex justify-between items-center text-sm mt-2">
                                <span className="text-gray-600">Código de Retirada:</span>
                                <span className="font-bold font-mono text-gray-900">{order.pickupCode}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-700 mb-3">Itens do Pedido</h3>
                    <ul className="divide-y divide-gray-200">
                        {order.items.map(item => (
                            <li key={item.uniqueId} className="py-3 flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    <p className="text-sm text-gray-500">{item.quantity} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
                                    {item.ean && <p className="text-xs text-gray-400 font-mono mt-1">EAN: {item.ean}</p>}
                                </div>
                                <p className="font-semibold text-gray-800 text-right flex-shrink-0 ml-4">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {hasCosts && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><DollarSignIcon className="mr-2 h-4 w-4" /> Valores e Taxas</h3>
                        <div className="space-y-2 text-sm">
                            {order.subtotal !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal dos Itens:</span>
                                    <span className="font-medium text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.subtotal)}</span>
                                </div>
                            )}
                            {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Taxa de Entrega:</span>
                                    <span className="font-medium text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.deliveryFee)}</span>
                                </div>
                            )}
                            {otherFeesTotal > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Outras Taxas:</span>
                                    <span className="font-medium text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(otherFeesTotal)}</span>
                                </div>
                            )}
                            {order.benefit?.benefits?.[0]?.sponsorships?.[0]?.amount?.value && (
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-600">Desconto:</span>
                                    <span className="font-medium text-green-600 font-bold">
                                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.benefit.benefits[0].sponsorships[0].amount.value / 100)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><CreditCardIcon className="mr-2 h-4 w-4" /> Pagamento</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Método:</span>
                            <span className="font-medium text-gray-800">{order.paymentMethod}</span>
                        </div>
                        {order.cashChangeFor && order.cashChangeFor > 0 && (
                            <div className="pt-2 space-y-2">
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-gray-600">Receber (dinheiro):</span>
                                    <span className="font-medium text-gray-800">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.cashChangeFor)}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold text-indigo-700 bg-indigo-50 p-2 rounded-md">
                                    <span>Troco:</span>
                                    <span>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.cashChangeFor - order.total)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-900">Total do Pedido</span>
                        <span className="text-lg font-bold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
                    </div>
                </div>
            </div>

            {nextAction && (
                <div className="fixed bottom-20 sm:bottom-0 left-0 right-0 p-4 bg-white border-t">
                    <button
                        onClick={handleAction}
                        disabled={isActionLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out text-center flex items-center justify-center"
                    >
                        {isActionLoading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                <span>Processando...</span>
                            </>
                        ) : (
                            nextAction.text
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;