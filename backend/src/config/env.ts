import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().default("postgresql://refmaster:refmaster@localhost:5432/refmaster?schema=public"),

  JWT_SECRET: z.string().default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),

  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_MODEL_HEAVY: z.string().default("gpt-4o"),

  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PREMIUM_PRICE_ID: z.string().optional().default(""),

  HCAPTCHA_SECRET: z.string().optional().default(""),

  UPLOAD_DIR: z.string().default("./uploads"),
  GENERATED_DIR: z.string().default("./generated"),

  FREE_PLAN_PAGE_LIMIT: z.coerce.number().default(10),
  FREE_PLAN_MONTHLY_LIMIT: z.coerce.number().default(3),
  PREMIUM_PLAN_PAGE_LIMIT: z.coerce.number().default(60),
  PREMIUM_PLAN_MONTHLY_LIMIT: z.coerce.number().default(200),

  SEMANTIC_SCHOLAR_API_KEY: z.string().optional().default(""),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
