
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { ORDER_STATUS_MAP } from '../../constants';

interface StatusBadgeProps {
  order: Order;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ order }) => {
  const { status, deliveryProvider } = order;

  // PRD Special Case: "When status is Dispatched and the order is waiting for iFood webhook update"
  // We'll interpret this as any DSP order delivered via iFood.
  if (status === OrderStatus.DSP && deliveryProvider === 'IFOOD') {
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-900`}
      >
        Aguardando iFood
      </span>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[status] || { text: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}
    >
      {statusInfo.text}
    </span>
  );
};

export default StatusBadge;