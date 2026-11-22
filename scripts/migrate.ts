import { config } from "dotenv";

/* Next.js `.env.local` okur ama `dotenv/config` yalnizca `.env` bakar; ikisini de yukluyoruz. */
config({ path: ".env.local", quiet: true });
config({ quiet: true });

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as pgliteMigrate } from "drizzle-orm/pglite/migrator";

import { kalmisKilidiTemizle } from "../lib/db/kilit";
import { uzakAdres, uzakMigrate } from "../lib/db/uzak";

/**
 * `drizzle/` altındaki SQL migrasyonlarını hedef veritabanına uygular.
 *
 * DATABASE_URL tanımlıysa ona (Neon ya da Supabase gibi bir Postgres), değilse yereldeki
 * PGlite dosyasına yazar.
 * Aynı betiği hem geliştirmede hem deploy öncesinde çalıştırabilmek için
 * sürücü seçimi burada tek noktada yapılıyor.
 */
async function calistir() {
  const adres = uzakAdres();
  const klasor = "./drizzle";

  if (adres) {
    console.log("→ Uzak veritabanına migrasyon uygulanıyor...");
    const tur = await uzakMigrate(adres, klasor);
    console.log(`✓ ${tur} migrasyonları tamamlandı.`);
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
