import { env } from '@/config/env';

export function isRealtimeEnabled(): boolean {
  return Boolean(
    env.PUSHER_APP_ID && env.PUSHER_APP_KEY && env.PUSHER_APP_SECRET,
  );
}
