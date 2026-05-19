import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { ATTENDANCE_QR_EXPIRES_SEC } from '@/lib/attendance-constants';

export interface JwtPayload {
  sub: string;  // userId
  iat?: number;
  exp?: number;
}

export const ATTENDANCE_QR_JWT_TYPE = 'attendance_qr' as const;

export interface AttendanceQrJwtPayload {
  type: typeof ATTENDANCE_QR_JWT_TYPE;
  storeId: number;
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

export function signAttendanceQrToken(storeId: number): string {
  return jwt.sign(
    { type: ATTENDANCE_QR_JWT_TYPE, storeId },
    env.JWT_SECRET,
    { expiresIn: ATTENDANCE_QR_EXPIRES_SEC },
  );
}

export function verifyAttendanceQrToken(token: string): { storeId: number } {
  const payload = jwt.verify(token, env.JWT_SECRET) as AttendanceQrJwtPayload;
  if (payload.type !== ATTENDANCE_QR_JWT_TYPE) {
    throw new Error('INVALID_QR_TOKEN_TYPE');
  }
  return { storeId: Number(payload.storeId) };
}
