import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

export const storeParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});

export const monthYearQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const attendanceQuerySchema = monthYearQuerySchema;

export const employeeAttendanceParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive(),
});

export const scanBodySchema = z.object({
  qrToken: z.string().min(1, 'Thiếu mã QR'),
});

export const attendanceParamsSchema = storeParamsSchema.extend({
  attendanceId: z.coerce.number().int().positive(),
});

export const createManualAttendanceSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  date: z.string().date(),
  status: z.nativeEnum(AttendanceStatus),
  checkIn: z.string().datetime().optional().nullable(),
  checkOut: z.string().datetime().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const patchAttendanceSchema = z.object({
  status: z.nativeEnum(AttendanceStatus).optional(),
  checkIn: z.string().datetime().optional().nullable(),
  checkOut: z.string().datetime().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  workMinutes: z.number().int().min(0).optional().nullable(),
});

export type MonthYearQueryDto = z.infer<typeof monthYearQuerySchema>;
export type AttendanceQueryDto = z.infer<typeof attendanceQuerySchema>;
export type ScanBodyDto = z.infer<typeof scanBodySchema>;
export type CreateManualAttendanceDto = z.infer<typeof createManualAttendanceSchema>;
export type PatchAttendanceDto = z.infer<typeof patchAttendanceSchema>;
