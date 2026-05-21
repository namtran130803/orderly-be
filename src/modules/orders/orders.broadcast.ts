import { broadcastOrderEvent } from '@/realtime/broadcast-order';
import type { OrderRealtimeAction } from '@/realtime/constants';
import {
  formatOrderForBroadcast,
  type OrderWithItems,
} from '@/modules/orders/orders.service';

export async function notifyOrderUpsert(
  storeId: number,
  action: Exclude<OrderRealtimeAction, 'deleted'>,
  order: OrderWithItems | null,
): Promise<void> {
  if (!order) return;
  const payload = await formatOrderForBroadcast(order);
  await broadcastOrderEvent(storeId, { action, order: payload });
}

export async function notifyOrderDeleted(
  storeId: number,
  orderId: number,
): Promise<void> {
  await broadcastOrderEvent(storeId, { action: 'deleted', orderId });
}
