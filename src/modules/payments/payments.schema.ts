import { z } from "zod";

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  status: z.enum(["PENDING", "PAID", "EXPIRED", "CANCELLED", "FAILED"]).optional(),
  storeId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  userName: z.string().trim().optional(),
  storeName: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

export type ListPaymentsQueryDto = z.infer<typeof listPaymentsQuerySchema>;

export const paymentResponseSchema = z.object({
  id: z.number(),
  storeId: z.number(),
  userId: z.number(),
  planId: z.number(),
  amount: z.number(),
  paymentCode: z.string(),
  transferContent: z.string(),
  provider: z.string(),
  status: z.enum(["PENDING", "PAID", "EXPIRED", "CANCELLED", "FAILED"]),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  store: z.object({
    id: z.number(),
    name: z.string(),
  }),
  user: z.object({
    id: z.number(),
    name: z.string(),
    phone: z.string(),
  }),
  plan: z.object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
    days: z.number(),
    price: z.number(),
  }),
});

export type PaymentResponseDto = z.infer<typeof paymentResponseSchema>;
