import { z } from 'zod';
import { LeaveRequestStatus } from '@prisma/client';

export const storeParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});

export const leaveQuerySchema = z.object({
  status: z.nativeEnum(LeaveRequestStatus).optional(),
});

export const createLeaveSchema = z.object({
  fromDate: z.string().date(),
  toDate: z.string().date(),
  isPaid: z.boolean(),
  reason: z.string().max(2000).optional().nullable(),
});

export const leaveIdParamsSchema = storeParamsSchema.extend({
  leaveId: z.coerce.number().int().positive(),
});

export type LeaveQueryDto = z.infer<typeof leaveQuerySchema>;
export type CreateLeaveDto = z.infer<typeof createLeaveSchema>;
