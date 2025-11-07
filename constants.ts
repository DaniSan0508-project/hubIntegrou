import { OrderStatus } from './types';

export const ORDER_STATUS_MAP: Record<OrderStatus, { text: string; color: string }> = {
  [OrderStatus.PLC]: { text: 'Recebido', color: 'bg-orange-100 text-orange-900' },
  [OrderStatus.COM]: { text: 'Confirmado', color: 'bg-green-100 text-green-900' },
  [OrderStatus.SPS]: { text: 'Início Separação', color: 'bg-yellow-100 text-yellow-900' },
  [OrderStatus.SPE]: { text: 'Fim Separação', color: 'bg-yellow-200 text-yellow-950' },
  [OrderStatus.DSP]: { text: 'Despachado', color: 'bg-purple-100 text-purple-900' },
  [OrderStatus.OPA]: { text: 'Chegou ao Destino', color: 'bg-indigo-100 text-indigo-900' },
  [OrderStatus.CON]: { text: 'Concluído', color: 'bg-teal-100 text-teal-900' },
  [OrderStatus.DDCS]: { text: 'Concluído (iFood)', color: 'bg-teal-100 text-teal-900' },
  [OrderStatus.CAN]: { text: 'Cancelado', color: 'bg-red-100 text-red-900' },
  [OrderStatus.CAR]: { text: 'Cancelamento Solicitado', color: 'bg-red-100 text-red-900' },
  [OrderStatus.CANCELLATION_REQUESTED]: { text: 'Cancelamento em Andamento', color: 'bg-yellow-200 text-yellow-950' },
};

export const NEXT_ACTION_MAP: Record<OrderStatus, { text: string; nextStatus: OrderStatus } | null> = {
    [OrderStatus.PLC]: { text: 'Confirmar', nextStatus: OrderStatus.COM },
    [OrderStatus.COM]: { text: 'Concluir Separação', nextStatus: OrderStatus.SPE },
    [OrderStatus.SPS]: { text: 'Finalizar Separação', nextStatus: OrderStatus.SPE },
    [OrderStatus.SPE]: { text: 'Despachar', nextStatus: OrderStatus.DSP },
    [OrderStatus.OPA]: null,
    [OrderStatus.DSP]: null,
    [OrderStatus.CON]: null,
    [OrderStatus.DDCS]: null,
    [OrderStatus.CAN]: null,
    [OrderStatus.CAR]: null,
    [OrderStatus.CANCELLATION_REQUESTED]: null,
};