import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    // Sadece `drizzle-kit push` / `studio` icin gerekli; `generate` bu degeri kullanmaz.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/bos",
  },
  verbose: true,
  strict: true,
} satisfies Config;
