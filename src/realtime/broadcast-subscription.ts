import {
  REALTIME_EVENTS,
  storeOrdersChannel,
  type SubscriptionRealtimePayload,
} from "@/realtime/constants";
import { isRealtimeEnabled } from "@/realtime/config";
import { getPusherServer } from "@/realtime/pusher-server";

export async function broadcastSubscriptionPaymentPaid(
  storeId: number,
  payload: SubscriptionRealtimePayload,
): Promise<void> {
  if (!isRealtimeEnabled()) return;

  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(
      storeOrdersChannel(storeId),
      REALTIME_EVENTS.SUBSCRIPTION_PAYMENT_PAID,
      payload,
    );
  } catch (err) {
    console.warn(
      "[realtime] broadcast subscription failed:",
      (err as Error).message,
    );
  }
}

