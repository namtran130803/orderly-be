import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET:   z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  PORT:         z.coerce.number().default(3000),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_APP_KEY: z.string().optional(),
  PUSHER_APP_SECRET: z.string().optional(),
  PUSHER_HOST: z.string().default('127.0.0.1'),
  PUSHER_PORT: z.coerce.number().default(6001),
  PUSHER_USE_TLS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  SEPAY_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_CODE_PREFIX: z.string().default('OD'),
  PAYMENT_BANK_NAME: z.string().default('MBBank'),
  PAYMENT_BANK_ACCOUNT_NO: z.string().default('0886138003'),
  PAYMENT_BANK_ACCOUNT_NAME: z.string().default('TRAN TRONG NAM'),
});

export const env = envSchema.parse(process.env);
