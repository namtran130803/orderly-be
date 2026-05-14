import { User, Store } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, 'id' | 'name' | 'phone'>;
      store?: Store;
    }
  }
}
