import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";

import * as schema from "./schema";

export type VeritabaniBaglantisi = NeonHttpDatabase<typeof schema> | PgliteDatabase<typeof schema>;

/**
 * Geliştirme ile üretim aynı SQL lehçesini kullanır ama farklı sürücülerle bağlanır.
 *
 * - Üretimde (Vercel) `DATABASE_URL` tanımlıdır ve Neon'un HTTP sürücüsü kullanılır.
 *   Serverless ortamda kalıcı bağlantı havuzu tutulamadığı için HTTP tercih edildi.
 * - Geliştirmede hiçbir harici hesap gerekmesin diye PGlite devreye girer. PGlite,
 *   Postgres'in WASM derlemesidir; aynı şemayı ve aynı sorguları çalıştırır, veriyi
 *   proje kökündeki `.pglite/` klasöründe saklar.
 *
 * Böylece Neon anahtarları gelmeden de tüm uygulama uçtan uca çalışabilir.
 */

const baglantiAdresi = process.env.DATABASE_URL?.trim();
export const neonKullaniliyor = Boolean(baglantiAdresi && /^postgres(ql)?:\/\//.test(baglantiAdresi));

/*
 * Next.js geliştirme sunucusu her dosya değişikliğinde modülleri yeniden yükler.
 * PGlite örneği global'de tutulmazsa her yenilemede yeni bir veritabanı açılır ve
 * dosya kilidi çakışır. Üretimde bu global hiç kullanılmaz.
 */
const global_ = globalThis as unknown as {
  __boztepePglite?: PGlite;
  __boztepeDb?: VeritabaniBaglantisi;
};

function baglantiKur(): VeritabaniBaglantisi {
  if (neonKullaniliyor) {
    return drizzleNeon(neon(baglantiAdresi!), { schema, casing: "snake_case" });
  }

  const pglite = global_.__boztepePglite ?? new PGlite("./.pglite");
  if (process.env.NODE_ENV !== "production") global_.__boztepePglite = pglite;

  return drizzlePglite(pglite, { schema, casing: "snake_case" });
}

export const db: VeritabaniBaglantisi = global_.__boztepeDb ?? baglantiKur();
if (process.env.NODE_ENV !== "production") global_.__boztepeDb = db;

/** Migrasyon ve tohumlama betiklerinin doğrudan eriştiği ham PGlite örneği. */
export function pgliteOrnegi(): PGlite {
  if (neonKullaniliyor) {
    throw new Error("Neon kullanılıyorken PGlite örneği istenemez.");
  }
  return global_.__boztepePglite ?? new PGlite("./.pglite");
}

export { schema };
