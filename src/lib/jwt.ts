import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';

export interface JwtPayload {
  sub: string;  // userId
  iat?: number;
  exp?: number;
}

export function signToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
