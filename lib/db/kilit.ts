import { existsSync, rmSync } from "node:fs";
import path from "node:path";

/**
 * Sahipsiz kalmış PGlite kilidini siler.
 *
 * PGlite kapanırken `.pglite/postmaster.pid` dosyasını her zaman kaldırmıyor. Geliştirme
 * sunucusu çökerse ya da zorla kapatılırsa dosya geride kalır ve bir sonraki açılış
 * `Aborted()` ile düşer. Belirtisi yanıltıcıdır: sunucu ayağa kalkar ama her sorgu
 * "Failed query" hatası verir.
 *
 * Kilidin gerçekten sahipsiz olduğunu işletim sistemine soramıyoruz; PGlite dosyaya
 * gerçek bir işlem kimliği değil sabit `-42` yazıyor. Ama aynı dizini iki süreç birden
 * zaten açamaz ve Next.js de aynı klasörde ikinci bir dev sunucusu başlatmayı reddeder.
 * Bu yüzden burada karşılaştığımız her kilidi sahipsiz kabul ediyoruz.
 *
 * Üretimde Neon kullanıldığı için bu kod yalnızca geliştirmeyi ilgilendirir.
 */
export function kalmisKilidiTemizle(sessiz = false): boolean {
  try {
    const kilit = path.join(process.cwd(), ".pglite", "postmaster.pid");
    if (!existsSync(kilit)) return false;

    rmSync(kilit, { force: true });
    if (!sessiz) console.info("[db] Sahipsiz PGlite kilidi temizlendi (.pglite/postmaster.pid).");
    return true;
  } catch {
    /* Silinemezse açılış zaten hata verecek ve mesaj kullanıcıya ulaşacak. */
    return false;
  }
}
