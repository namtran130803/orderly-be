import {
  REALTIME_EVENTS,
  storeOrdersChannel,
  type OrderRealtimePayload,
} from '@/realtime/constants';
import { isRealtimeEnabled } from '@/realtime/config';
import { getPusherServer } from '@/realtime/pusher-server';

export async function broadcastOrderEvent(
  storeId: number,
  payload: OrderRealtimePayload,
): Promise<void> {
  if (!isRealtimeEnabled()) return;

  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(
      storeOrdersChannel(storeId),
      REALTIME_EVENTS.ORDER_CHANGED,
      payload,
    );
  } catch (err) {
    console.warn('[realtime] broadcast order failed:', (err as Error).message);
  }
}
