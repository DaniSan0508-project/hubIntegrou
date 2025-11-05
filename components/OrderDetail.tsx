import React, { useState, useEffect, useCallback } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import StatusBadge from './StatusBadge';
import { NEXT_ACTION_MAP } from '../constants';
import { BackIcon, UserIcon, MapPinIcon, CreditCardIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  return (
    <div className="bg-gray-50 min-h-full">
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
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><UserIcon className="mr-2" /> Cliente e Entrega</h3>
            <p className="font-bold text-gray-900">{order.customerName}</p>
            <p className="text-sm text-gray-600 flex items-start"><MapPinIcon className="mr-2 mt-1 flex-shrink-0" /> {order.deliveryAddress}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><CreditCardIcon className="mr-2" /> Pagamento</h3>
            <p className="text-sm text-gray-600">{order.paymentMethod}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-700 mb-3">Itens do Pedido</h3>
          <ul className="divide-y divide-gray-200">
            {order.items.map(item => (
              <li key={item.uniqueId} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
                </div>
                <p className="font-semibold text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}</p>
              </li>
            ))}
          </ul>
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