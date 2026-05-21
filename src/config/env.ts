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
});

export const env = envSchema.parse(process.env);
