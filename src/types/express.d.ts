import { Store } from '@prisma/client';

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
    }
  }
}
