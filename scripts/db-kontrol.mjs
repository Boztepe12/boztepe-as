import { execSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import net from "node:net";
import path from "node:path";

import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

/**
 * `npm run dev` oncesinde otomatik calisir (package.json `predev`).
 *
 * Yerel veritabani PGlite, Postgres'in WASM derlemesidir ve ancak duzgun kapatilirsa
 * saglam kalir. Gelistirme sunucusu zorla kapatilirsa (taskkill /F, bilgisayarin ani
 * kapanmasi) veri dizini bozulabiliyor. Bozuk dizinin belirtisi yaniltici: sunucu
 * sorunsuz ayaga kalkiyor, sayfalar ise "Failed query" ile 500 donuyor.
 *
 * Bu betik acilistan once dizini yoklar ve bozuksa yeniden kurar.
 *
 * Neon kullaniliyorsa (DATABASE_URL tanimli) kontrol tamamen atlanir.
 */

const PGLITE_DIZINI = path.join(process.cwd(), ".pglite");
const KILIT = path.join(PGLITE_DIZINI, "postmaster.pid");
const DEV_PORTU = Number(process.env.PORT ?? 3000);

const adres = process.env.DATABASE_URL?.trim();
if (adres && /^postgres(ql)?:\/\//.test(adres)) {
  process.exit(0);
}

/**
 * PGlite tek yazicidir: dizini baska bir surec tutuyorsa acilis yine `Aborted()`
 * verir ve bu, bozulmayla birebir ayni gorunur. Ikisini karistirip calisan bir
 * sunucunun verisini silmemek icin once portu yokluyoruz.
 */
function devSunucusuCalisiyorMu() {
  /*
   * Porta baglanmayi deniyoruz, dinlemeyi degil. Windows'ta 0.0.0.0'a bagli bir
   * sunucu varken 127.0.0.1'e ayrica baglanmak basarili olabiliyor; o yuzden
   * "dinleyebiliyor muyum" testi yanlis sonuc veriyor. Baglanti kurulabiliyorsa
   * karsida gercekten calisan bir sunucu vardir.
   */
  return new Promise((coz) => {
    const soket = new net.Socket();
    const bitir = (sonuc) => {
      soket.destroy();
      coz(sonuc);
    };

    soket.setTimeout(1000);
    soket.once("connect", () => bitir(true));
    soket.once("timeout", () => bitir(false));
    soket.once("error", () => bitir(false));
    soket.connect(DEV_PORTU, "127.0.0.1");
  });
}

function komut(satir) {
  execSync(satir, { stdio: "inherit" });
}

function kur(sebep, bozukDizinVar) {
  console.log(`\n[db] ${sebep}`);

  if (bozukDizinVar) {
    /*
     * Silmek yerine yeniden adlandiriyoruz: teshis yanlissa veri hâlâ diskte durur.
     *
     * Yeniden adlandirma basarisiz olursa dizini baska bir surec aciktir; bu durumda
     * dizin bozuk degil, sadece mesguldur. Silmek gercek veriyi yok edecegi icin
     * hicbir sey yapmadan cikiyoruz.
     */
    const yedek = `${PGLITE_DIZINI}-bozuk-${Date.now()}`;
    try {
      renameSync(PGLITE_DIZINI, yedek);
      console.log(`[db] Eski dizin saklandi: ${path.basename(yedek)}`);
    } catch {
      console.error(
        "\n[db] Veritabani dizini baska bir surec tarafindan kullaniliyor.\n" +
          "[db] Calisan gelistirme sunucusunu kapatip tekrar deneyin.\n" +
          "[db] Veriye dokunulmadi.\n",
      );
      process.exit(1);
    }
  }

  console.log("[db] Yerel veritabani sifirdan kuruluyor...\n");
  komut("npm run db:migrate");
  komut("npm run db:seed");
  console.log("\n[db] Hazir.\n");
}

async function calistir() {
  if (await devSunucusuCalisiyorMu()) {
    console.log(
      `[db] ${DEV_PORTU} portunda zaten bir sunucu var; veritabani kontrolu atlandi.`,
    );
    return;
  }

  if (!existsSync(PGLITE_DIZINI)) {
    kur("Yerel veritabani bulunamadi.", false);
    return;
  }

  /* Sahipsiz kalmis kilit, saglam bir dizinin bile acilmasini engeller. */
  if (existsSync(KILIT)) {
    rmSync(KILIT, { force: true });
    console.log("[db] Sahipsiz PGlite kilidi temizlendi.");
  }

  try {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite("./.pglite");
    const sonuc = await db.query("select count(*)::int as adet from urunler");
    await db.close();
    console.log(`[db] Yerel veritabani saglam (${sonuc.rows[0].adet} urun).`);
  } catch {
    kur("Yerel veritabani okunamiyor (dizin bozulmus).", true);
  }
}

calistir().catch((hata) => {
  console.error("[db] Kontrol basarisiz:", hata?.message ?? hata);
  process.exit(1);
});
