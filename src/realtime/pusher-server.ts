import Pusher from 'pusher';
import { env } from '@/config/env';
import { isRealtimeEnabled } from '@/realtime/config';

let client: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (!isRealtimeEnabled()) return null;
  if (!client) {
    client = new Pusher({
      appId: env.PUSHER_APP_ID!,
      key: env.PUSHER_APP_KEY!,
      secret: env.PUSHER_APP_SECRET!,
      host: env.PUSHER_HOST,
      port: String(env.PUSHER_PORT),
      useTLS: env.PUSHER_USE_TLS,
    });
  }
  return client;
}
