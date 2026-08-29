import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const kilitYolu = () => path.join(process.cwd(), ".pglite", "postmaster.pid");

/*
 * Sahip dosyası bilerek veri dizininin dışında duruyor: `.pglite` bir Postgres veri
 * dizini ve içine yabancı dosya koymamak en temizi.
 */
const sahipYolu = () => path.join(process.cwd(), ".pglite-sahip.json");

/**
 * PGlite'ı açan sürecin kimliğini yazar; kilit sahipliği buradan anlaşılıyor.
 * Dizin hâlâ yaşayan başka bir sürece aitse dosyaya dokunulmaz — yoksa geçici
 * yardımcı süreçler (örneğin Next'in `generateStaticParams` işçisi) sahipliği
 * kendi üstlerine yazar ve sonlandıklarında koruma boşa düşer.
 */
export function sahipligiYaz(): void {
  try {
    if (calisanSahip() !== null) return;
    writeFileSync(sahipYolu(), JSON.stringify({ pid: process.pid, zaman: Date.now() }));
  } catch {
    /* Yazılamazsa yalnızca kilit koruması devre dışı kalır, uygulama çalışmayı sürdürür. */
  }
}

export function sahipligiBirak(): void {
  try {
    /* Sahiplik başkasındaysa onun dosyasını silmiyoruz. */
    if (calisanSahip() !== null) return;
    rmSync(sahipYolu(), { force: true });
  } catch {
    /* Yoksay. */
  }
}

/**
 * `.pglite` dizinini şu an açık tutan başka bir süreç varsa kimliğini döner.
 * Kendi sürecimiz ya da çoktan sonlanmış bir süreç için `null` döner.
 */
function calisanSahip(): number | null {
  try {
    if (!existsSync(sahipYolu())) return null;

    const icerik = JSON.parse(readFileSync(sahipYolu(), "utf8")) as { pid?: unknown };
    const pid = Number(icerik.pid);
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return null;

    /* Sinyal 0 süreci öldürmez, yalnızca var olup olmadığını sorar. */
    process.kill(pid, 0);
    return pid;
  } catch (hata) {
    /* EPERM: süreç var ama bize ait değil — yine de yaşıyor demektir. */
    if (hata instanceof Error && "code" in hata && hata.code === "EPERM") return -1;
    return null;
  }
}

/**
 * Sahipsiz kalmış PGlite kilidini siler.
 *
 * PGlite kapanırken `.pglite/postmaster.pid` dosyasını her zaman kaldırmıyor. Geliştirme
 * sunucusu çökerse ya da zorla kapatılırsa dosya geride kalır ve bir sonraki açılış
 * `Aborted()` ile düşer. Belirtisi yanıltıcıdır: sunucu ayağa kalkar ama her sorgu
 * "Failed query" hatası verir.
 *
 * Kilidin sahibini PGlite'ın kendisine soramıyoruz; dosyaya gerçek bir işlem kimliği
 * değil sabit `-42` yazıyor. Bu yüzden dizini açan süreç kendi kimliğini ayrıca
 * `.pglite-sahip.json` dosyasına bırakıyor. O süreç hâlâ yaşıyorsa kilit sahipsiz
 * değildir ve dosyaya dokunmuyoruz — aksi hâlde ikinci bir süreç dizini açık sanıp
 * aynı veriye yazmaya kalkar ki bozulmanın en hızlı yolu budur.
 *
 * Üretimde Neon kullanıldığı için bu kod yalnızca geliştirmeyi ilgilendirir.
 */
export function kalmisKilidiTemizle(sessiz = false): boolean {
  try {
    if (!existsSync(kilitYolu())) return false;

    const sahip = calisanSahip();
    if (sahip !== null) {
      if (!sessiz) {
        console.warn(
          "[db] .pglite dizini başka bir süreçte açık" +
            (sahip > 0 ? ` (pid ${sahip})` : "") +
            "; kilit dosyasına dokunulmadı.",
        );
      }
      return false;
    }

    rmSync(kilitYolu(), { force: true });
    if (!sessiz) console.info("[db] Sahipsiz PGlite kilidi temizlendi (.pglite/postmaster.pid).");
    return true;
  } catch {
    /* Silinemezse açılış zaten hata verecek ve mesaj kullanıcıya ulaşacak. */
    return false;
  }
}
