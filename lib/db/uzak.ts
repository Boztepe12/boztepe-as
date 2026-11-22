import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate as neonMigrate } from "drizzle-orm/neon-http/migrator";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as pgMigrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Uzak (canlı) veritabanı: `DATABASE_URL` tanımlıysa. İki tür desteklenir:
 *
 * - **Neon** (alan adı `neon.tech`): Neon'un HTTP sürücüsü — Neon'a özel bir
 *   protokol, başka bir Postgres'le konuşmaz.
 * - **Diğer her Postgres** (Supabase dahil): standart sürücü `pg` (node-postgres).
 *   Supabase'te Vercel için "Transaction pooler" adresi (port 6543) kullanılır.
 *   `pg` her bağlantıda bir sorgu bitmeden ötekini göndermez ve adsız sorgular
 *   kullanır; ikisi de bu havuz için gerekli. (postgres.js tek bağlantıya birden
 *   çok sorgu yığıyordu — pipelining — ve Supabase'in Transaction pooler'ında
 *   sayfanın paralel sorguları sonsuza dek asılı kalıyordu: derleme 60 sn'de düştü.)
 *
 * Yerelde (`DATABASE_URL` yoksa) PGlite kullanılır; bkz. `lib/db/index.ts`.
 */

export function uzakAdres(): string | null {
  const adres = process.env.DATABASE_URL?.trim();
  if (!adres) return null;
  if (!/^postgres(ql)?:\/\//.test(adres)) {
    throw new Error("DATABASE_URL postgres:// ya da postgresql:// ile başlamalı (Supabase → Connect → Transaction pooler).");
  }
  try {
    new URL(adres);
  } catch {
    throw new Error(
      "DATABASE_URL okunamadı. Şifrede @ # / ? % gibi bir karakter varsa adres bozulur: Supabase'de şifreyi yalnız harf ve rakamdan oluşacak şekilde yenileyin ya da bu karakterleri kodlayın (@ → %40).",
    );
  }
  return adres;
}

export function neonMu(adres: string): boolean {
  try {
    return new URL(adres).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

function pgHavuzu(adres: string, betik = false) {
  const url = new URL(adres);
  const yerel = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  // sslmode adresde kalırsa pg kendi ayarını uygular ve aşağıdakini ezer.
  url.searchParams.delete("sslmode");
  return new Pool({
    connectionString: url.toString(),
    // Supabase'in sertifikası Node'un güvendiği köklerde yok; bağlantı yine şifreli.
    ssl: yerel ? false : { rejectUnauthorized: false },
    // Sunucusuz: örnek başına birkaç bağlantı yeter; havuz (Supavisor) gerisini taşır.
    max: betik ? 1 : 5,
    idleTimeoutMillis: betik ? 1000 : 20000,
    // Ulaşılamayan bir adres derlemeyi ve sayfayı dakikalarca asılı tutmasın.
    connectionTimeoutMillis: 10000,
    // Asılı kalan bir sorgu da sonsuza dek beklemesin.
    statement_timeout: 15000,
    query_timeout: 20000,
  });
}

/** Drizzle bağlantısı; tip, uygulamanın ortak tipine (Neon) uyarlanır. */
export function uzakBaglanti<S extends Record<string, unknown>>(adres: string, schema: S) {
  if (neonMu(adres)) return drizzleNeon(neon(adres), { schema, casing: "snake_case" });
  return drizzlePg(pgHavuzu(adres), { schema, casing: "snake_case" }) as unknown as ReturnType<
    typeof drizzleNeon<S>
  >;
}

/** `drizzle/` migrasyonlarını uzak veritabanına uygular; sürücü adrese göre. */
export async function uzakMigrate(adres: string, klasor: string): Promise<string> {
  if (neonMu(adres)) {
    await neonMigrate(drizzleNeon(neon(adres)), { migrationsFolder: klasor });
    return "Neon";
  }
  const havuz = pgHavuzu(adres, true);
  try {
    await pgMigrate(drizzlePg(havuz), { migrationsFolder: klasor });
  } finally {
    await havuz.end();
  }
  return "Postgres";
}

/** Tohum betiği için: bitince kapatılabilen bağlantı. */
export function uzakBetikBaglantisi<S extends Record<string, unknown>>(adres: string, schema: S) {
  if (neonMu(adres)) return { db: drizzleNeon(neon(adres), { schema, casing: "snake_case" }), kapat: async () => {} };
  const havuz = pgHavuzu(adres, true);
  return {
    db: drizzlePg(havuz, { schema, casing: "snake_case" }) as unknown as ReturnType<typeof drizzleNeon<S>>,
    kapat: () => havuz.end(),
  };
}
