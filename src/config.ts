import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  MONDAY_API_TOKEN: z.string().min(1),
  MONDAY_API_URL: z.string().url().default('https://api.monday.com/v2'),
  MONDAY_API_VERSION: z.string().default('2024-10'),
  MONDAY_BOARD_ID: z.string().min(1),

  WEBHOOK_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const config = parsed.data;
