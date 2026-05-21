/** Kênh private theo cửa hàng — đồng bộ với FE `realtime/constants.ts`. */
export function storeOrdersChannel(storeId: number): string {
  return `private-store-${storeId}-orders`;
}

export const REALTIME_EVENTS = {
  ORDER_CHANGED: 'order.changed',
} as const;

export type OrderRealtimeAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'deleted';

export type OrderRealtimeItem = {
  id: number;
  menuItemId: number | null;
  statusId: number | null;
  statusSnapshot: string | null;
  nameSnapshot: string;
  priceSnapshot: number;
  qty: number;
};

export type OrderRealtimeOrder = {
  id: number;
  tableId: number | null;
  tableSnapshot: string | null;
  statusId: number | null;
  statusSnapshot: string | null;
  createdAt: string;
  items: OrderRealtimeItem[];
};

export type OrderRealtimePayload =
  | { action: 'deleted'; orderId: number }
  | {
      action: Exclude<OrderRealtimeAction, 'deleted'>;
      order: OrderRealtimeOrder;
    };
