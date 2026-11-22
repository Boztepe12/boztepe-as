import { randomUUID } from "node:crypto";

import { supabaseHazir, supabaseSil, supabaseYaz, supabaseYuklemeAdresi } from "./supabase";
import { yerelSil, yerelYaz } from "./yerel";

/**
 * Dosya deposu — görseller ve PDF kataloglar. Kodun geri kalanı yalnız bu dosyayı
 * kullanır; hangi sürücünün çalıştığını bilmez:
 *
 * - **Supabase Storage** (`supabase.ts`): `SUPABASE_URL` ve `SUPABASE_SECRET_KEY`
 *   tanımlıysa — canlı.
 * - **Yerel** (`yerel.ts`): değilse — geliştirme, `public/yuklenenler`.
 *
 * Her dosyanın bir kimliği vardır (`sb:<yol>` ya da `yerel:<yol>`); veritabanında
 * adresle birlikte saklanır ve silerken hangi depoda olduğunu söyler. Dosya adı
 * kullanıcıdan alınmaz: `<klasör>/<uuid>.<uzantı>`, uzantı da dosyanın türünden.
 */

export type YuklenenDosya = { url: string; kimlik: string };

/** Kullanıcıya gösterilebilecek doğrulama hatası (tür, boyut). */
export class DosyaHatasi extends Error {}

/** Canlı depo (Supabase) ayarlı mı; değilse dosyalar yerelde tutulur. */
export const uzakDepo = supabaseHazir;

const GORSEL_TURLERI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
const GORSEL_AZAMI = 8 * 1024 * 1024; // 8 MB
export const PDF_AZAMI_BOYUT = 50 * 1024 * 1024; // 50 MB (Supabase ücretsiz paketinin dosya sınırı)

function klasorAdi(klasor: string): string {
  return klasor.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "genel";
}

function gorselDenetle(dosya: File): string {
  const uzanti = GORSEL_TURLERI[dosya.type];
  if (!uzanti) throw new DosyaHatasi("Yalnızca JPG, PNG, WEBP, AVIF veya GIF yükleyebilirsiniz.");
  if (dosya.size === 0) throw new DosyaHatasi("Dosya boş görünüyor.");
  if (dosya.size > GORSEL_AZAMI) throw new DosyaHatasi("Görsel en fazla 8 MB olabilir.");
  return uzanti;
}

export function pdfDenetle(dosya: { type: string; name: string; size: number }) {
  const pdfMi = dosya.type === "application/pdf" || dosya.name.toLowerCase().endsWith(".pdf");
  if (!pdfMi) throw new DosyaHatasi("Yalnızca PDF dosyası yükleyebilirsiniz.");
  if (dosya.size === 0) throw new DosyaHatasi("Dosya boş görünüyor.");
  if (dosya.size > PDF_AZAMI_BOYUT) throw new DosyaHatasi("PDF en fazla 50 MB olabilir.");
}

/** Görseli (ürün, kategori, marka, afiş, galeri, katalog kapağı) yükler. */
export async function gorselYukle(dosya: File, klasor = "urunler"): Promise<YuklenenDosya> {
  const uzanti = gorselDenetle(dosya);
  const yol = `${klasorAdi(klasor)}/${randomUUID()}.${uzanti}`;
  return uzakDepo ? supabaseYaz(yol, dosya) : yerelYaz(yol, await dosya.arrayBuffer());
}

/**
 * PDF katalog yüklemesini hazırlar. Canlıda tarayıcı dosyayı dönen `yuklemeAdresi`ne
 * doğrudan PUT eder (sunucudan geçmez); yerelde `{ yerel: true }` döner ve tarayıcı
 * dosyayı `/api/admin/katalog-pdf` rotasına gönderir.
 */
export async function pdfYuklemeHazirla(): Promise<({ yerel: false; yuklemeAdresi: string } & YuklenenDosya) | { yerel: true }> {
  if (!uzakDepo) return { yerel: true };
  return { yerel: false, ...(await supabaseYuklemeAdresi(`kataloglar/${randomUUID()}.pdf`)) };
}

/** Geliştirme: PDF'i yerel depoya yazar (canlıda kullanılmaz). */
export async function pdfYerelYukle(dosya: File): Promise<YuklenenDosya> {
  pdfDenetle(dosya);
  return yerelYaz(`kataloglar/${randomUUID()}.pdf`, await dosya.arrayBuffer());
}

/** Yüklenmiş bir dosyanın kimliği bu biçimlerden biri olmalı (katalog kaydı doğrulaması). */
export const KATALOG_PDF_KIMLIGI = /^(sb|yerel):kataloglar\/[0-9a-f-]{36}\.pdf$/;

/**
 * Dosyayı depodan siler. Kayıt zaten veritabanından kalktığı için hata kullanıcıya
 * yansıtılmaz; en kötü ihtimalle depoda artık bir dosya kalır.
 */
export async function dosyaSil(kimlik: string | null | undefined): Promise<void> {
  if (!kimlik) return;
  try {
    if (kimlik.startsWith("yerel:")) await yerelSil(kimlik.slice("yerel:".length));
    else if (kimlik.startsWith("sb:") && uzakDepo) await supabaseSil(kimlik.slice("sb:".length));
  } catch {
    /* Yoksay. */
  }
}
