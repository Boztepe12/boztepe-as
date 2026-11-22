import { PGlite } from "@electric-sql/pglite";
import { type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";

import { kalmisKilidiTemizle, sahipligiBirak, sahipligiYaz } from "./kilit";
import { uzakAdres, uzakBaglanti } from "./uzak";
import * as schema from "./schema";

/**
 * İki sürücü de Drizzle'ın aynı sorgu API'sini sunar; birleşim tipi kullanmak ise
 * her çağrıda TypeScript'i aşırı yüklüyor ve sorguları okunmaz hâle getiriyor.
 * Bu yüzden tek bir tip üzerinden ilerleyip PGlite örneğini ona uyarlıyoruz.
 * Kullandığımız yüzey (select/insert/update/delete ve `query`) her ikisinde ortak.
 */
export type VeritabaniBaglantisi = NeonHttpDatabase<typeof schema>;

/**
 * Geliştirme ile üretim aynı SQL lehçesini kullanır ama farklı sürücülerle bağlanır.
 *
 * - Üretimde (Vercel) `DATABASE_URL` tanımlıdır: Neon ise Neon'un HTTP sürücüsü,
 *   değilse (Supabase gibi) standart Postgres sürücüsü — bkz. `lib/db/uzak.ts`.
 * - Geliştirmede hiçbir harici hesap gerekmesin diye PGlite devreye girer. PGlite,
 *   Postgres'in WASM derlemesidir; aynı şemayı ve aynı sorguları çalıştırır, veriyi
 *   proje kökündeki `.pglite/` klasöründe saklar.
 *
 * Böylece Neon anahtarları gelmeden de tüm uygulama uçtan uca çalışabilir.
 */

const baglantiAdresi = uzakAdres();
/** Uzak veritabanı (Neon ya da Supabase gibi bir Postgres) kullanılıyor mu; adı tarihsel. */
export const neonKullaniliyor = baglantiAdresi !== null;

/*
 * Next.js geliştirme sunucusu her dosya değişikliğinde modülleri yeniden yükler.
 * PGlite örneği global'de tutulmazsa her yenilemede yeni bir veritabanı açılır ve
 * dosya kilidi çakışır. Üretimde bu global hiç kullanılmaz.
 */
const global_ = globalThis as unknown as {
  __boztepePglite?: PGlite;
  __boztepeDb?: VeritabaniBaglantisi;
  __boztepeKapanisKurulu?: boolean;
};

/**
 * PGlite yalnızca düzgün kapatıldığında veri dizinini sağlam bırakır; süreç aniden
 * sonlanırsa dizin bozulabiliyor ve sonraki açılışta bütün sorgular düşüyor.
 * Ctrl+C ile durdurmak en sık kullanılan yol olduğundan, o sinyali yakalayıp
 * veritabanını kapatıyoruz. (Zorla sonlandırma yakalanamaz — onun için
 * `npm run dev` öncesi çalışan `scripts/db-kontrol.mjs` onarımı üstleniyor.)
 */
function kapanistaKapat(pglite: PGlite) {
  if (global_.__boztepeKapanisKurulu) return;
  global_.__boztepeKapanisKurulu = true;

  const kapat = () => {
    void pglite
      .close()
      .catch(() => {})
      .finally(() => {
        sahipligiBirak();
        process.exit(0);
      });
  };

  process.once("SIGINT", kapat);
  process.once("SIGTERM", kapat);
}

function baglantiKur(): VeritabaniBaglantisi {
  /* Vercel'de PGlite çalışmaz (dosya sistemi salt okunur): adres yoksa açıkça söyle. */
  if (!neonKullaniliyor && process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL tanımlı değil. Vercel → Settings → Environment Variables'a Supabase'in Transaction pooler adresini (Production) girin ve yeniden deploy edin.",
    );
  }
  if (neonKullaniliyor) {
    return uzakBaglanti(baglantiAdresi!, schema);
  }

  if (!global_.__boztepePglite) kalmisKilidiTemizle();

  const pglite = global_.__boztepePglite ?? new PGlite("./.pglite");
  if (process.env.NODE_ENV !== "production") {
    global_.__boztepePglite = pglite;
    /* Dizini bu sürecin açtığını yazıyoruz; başka bir süreç kilidi sahipsiz sanıp
       silmesin diye. Ayrıntı için `lib/db/kilit.ts`. */
    sahipligiYaz();
    kapanistaKapat(pglite);
  }

  const yerel: PgliteDatabase<typeof schema> = drizzlePglite(pglite, {
    schema,
    casing: "snake_case",
  });
  return yerel as unknown as VeritabaniBaglantisi;
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
