import { Store } from '@prisma/client';
import type { SubscriptionSnapshot } from '@/modules/subscriptions/subscriptions.service';

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  permissions: string[];
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      store?: Store;
      storeSubscription?: SubscriptionSnapshot;
    }
  }
}
