import { config } from "dotenv";

/* Next.js `.env.local` okur ama `dotenv/config` yalnizca `.env` bakar; ikisini de yukluyoruz. */
config({ path: ".env.local", quiet: true });
config({ quiet: true });

import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate as neonMigrate } from "drizzle-orm/neon-http/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as pgliteMigrate } from "drizzle-orm/pglite/migrator";

import { kalmisKilidiTemizle } from "../lib/db/kilit";

/**
 * `drizzle/` altındaki SQL migrasyonlarını hedef veritabanına uygular.
 *
 * DATABASE_URL tanımlıysa Neon'a, değilse yereldeki PGlite dosyasına yazar.
 * Aynı betiği hem geliştirmede hem deploy öncesinde çalıştırabilmek için
 * sürücü seçimi burada tek noktada yapılıyor.
 */
async function calistir() {
  const adres = process.env.DATABASE_URL?.trim();
  const klasor = "./drizzle";

  if (adres && /^postgres(ql)?:\/\//.test(adres)) {
    console.log("→ Neon veritabanına migrasyon uygulanıyor...");
    const db = drizzleNeon(neon(adres));
    await neonMigrate(db, { migrationsFolder: klasor });
    console.log("✓ Neon migrasyonları tamamlandı.");
    return;
  }

  kalmisKilidiTemizle();
  console.log("→ Yerel PGlite veritabanına migrasyon uygulanıyor (./.pglite)...");
  const pglite = new PGlite("./.pglite");
  const db = drizzlePglite(pglite);
  await pgliteMigrate(db, { migrationsFolder: klasor });
  await pglite.close();
  console.log("✓ PGlite migrasyonları tamamlandı.");
}

calistir().catch((hata) => {
  console.error("✗ Migrasyon başarısız:", hata);
  process.exit(1);
});
