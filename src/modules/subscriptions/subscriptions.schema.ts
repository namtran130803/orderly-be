import { z } from "zod";
import { paginationSchema } from "@/lib/pagination";

export const storeSubscriptionParamsSchema = z.object({
  storeId: z.coerce.number().int().positive(),
});

export const subscriptionPlanParamsSchema = z.object({
  planId: z.coerce.number().int().positive(),
});

export const checkoutSchema = z.object({
  planDays: z.coerce.number().int().positive(),
});

export const subscriptionHistoryQuerySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  userName: z.string().trim().optional(),
  storeName: z.string().trim().optional(),
  status: z.enum(["PENDING", "PAID", "EXPIRED", "CANCELLED", "FAILED"]).optional(),
  source: z.enum(["TRIAL", "PAYMENT", "ADMIN_ADJUSTMENT", "LEGACY_GRACE"]).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

export const storePeriodsQuerySchema = paginationSchema.extend({
  source: z.enum(["TRIAL", "PAYMENT", "ADMIN_ADJUSTMENT", "LEGACY_GRACE"]).optional(),
});

export const adminRenewalSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  days: z.coerce.number().int().positive(),
});

export const createSubscriptionPlanSchema = z.object({
  code: z.string().trim().min(1).max(32).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  days: z.coerce.number().int().positive(),
  price: z.coerce.number().int().nonnegative(),
});

export const updateSubscriptionPlanSchema = z.object({
  code: z.string().trim().min(1).max(32).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  days: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
export type AdminRenewalDto = z.infer<typeof adminRenewalSchema>;
export type CreateSubscriptionPlanDto = z.infer<typeof createSubscriptionPlanSchema>;
export type UpdateSubscriptionPlanDto = z.infer<typeof updateSubscriptionPlanSchema>;
export type SubscriptionHistoryQueryDto = z.infer<typeof subscriptionHistoryQuerySchema>;
export type StorePeriodsQueryDto = z.infer<typeof storePeriodsQuerySchema>;
