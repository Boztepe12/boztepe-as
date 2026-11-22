import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate as neonMigrate } from "drizzle-orm/neon-http/migrator";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { migrate as pgMigrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Uzak (canlı) veritabanı: `DATABASE_URL` tanımlıysa. İki tür desteklenir:
 *
 * - **Neon** (alan adı `neon.tech`): Neon'un HTTP sürücüsü — Neon'a özel bir
 *   protokol, başka bir Postgres'le konuşmaz.
 * - **Diğer her Postgres** (Supabase dahil): standart sürücü `postgres` (postgres.js).
 *   Supabase'te Vercel için "Transaction pooler" adresi (port 6543) kullanılır;
 *   o havuz hazırlanmış sorguları (prepared statements) desteklemediği için
 *   `prepare: false`. Sunucusuz ortamda her örnek tek bağlantı tutar (`max: 1`).
 *
 * Yerelde (`DATABASE_URL` yoksa) PGlite kullanılır; bkz. `lib/db/index.ts`.
 */

export function uzakAdres(): string | null {
  const adres = process.env.DATABASE_URL?.trim();
  return adres && /^postgres(ql)?:\/\//.test(adres) ? adres : null;
}

export function neonMu(adres: string): boolean {
  try {
    return new URL(adres).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

function pgIstemcisi(adres: string, betik = false) {
  const host = new URL(adres).hostname;
  const yerel = host === "localhost" || host === "127.0.0.1";
  return postgres(adres, {
    prepare: false,
    max: 1,
    ssl: yerel ? false : "require",
    // Betikler (migrasyon, tohum) bitince bağlantı kapansın; uygulamada boşta 20 sn sonra.
    idle_timeout: betik ? 1 : 20,
    onnotice: () => {},
  });
}

/** Drizzle bağlantısı; tip, uygulamanın ortak tipine (Neon) uyarlanır. */
export function uzakBaglanti<S extends Record<string, unknown>>(adres: string, schema: S) {
  if (neonMu(adres)) return drizzleNeon(neon(adres), { schema, casing: "snake_case" });
  return drizzlePg(pgIstemcisi(adres), { schema, casing: "snake_case" }) as unknown as ReturnType<
    typeof drizzleNeon<S>
  >;
}

/** `drizzle/` migrasyonlarını uzak veritabanına uygular; sürücü adrese göre. */
export async function uzakMigrate(adres: string, klasor: string): Promise<string> {
  if (neonMu(adres)) {
    await neonMigrate(drizzleNeon(neon(adres)), { migrationsFolder: klasor });
    return "Neon";
  }
  const istemci = pgIstemcisi(adres, true);
  try {
    await pgMigrate(drizzlePg(istemci), { migrationsFolder: klasor });
  } finally {
    await istemci.end({ timeout: 5 });
  }
  return "Postgres";
}

/** Tohum betiği için: bitince kapatılabilen bağlantı. */
export function uzakBetikBaglantisi<S extends Record<string, unknown>>(adres: string, schema: S) {
  if (neonMu(adres)) return { db: drizzleNeon(neon(adres), { schema, casing: "snake_case" }), kapat: async () => {} };
  const istemci = pgIstemcisi(adres, true);
  return {
    db: drizzlePg(istemci, { schema, casing: "snake_case" }) as unknown as ReturnType<typeof drizzleNeon<S>>,
    kapat: () => istemci.end({ timeout: 5 }),
  };
}
