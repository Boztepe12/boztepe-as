import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Geliştirme sürücüsü: dosyayı `public/yuklenenler/<yol>` altına yazar (gitignore'da),
 * site adresinden `/yuklenenler/<yol>` olarak sunulur. Vercel'in dosya sistemi salt
 * okunur, canlıda çalışmaz — orada Supabase Storage kullanılır (`supabase.ts`).
 * Kimlik: `yerel:<yol>`.
 */

const KOK = path.join(process.cwd(), "public", "yuklenenler");

export async function yerelYaz(yol: string, icerik: ArrayBuffer): Promise<{ url: string; kimlik: string }> {
  const hedef = path.join(KOK, yol);
  await mkdir(path.dirname(hedef), { recursive: true });
  await writeFile(hedef, Buffer.from(icerik));
  return { url: `/yuklenenler/${yol}`, kimlik: `yerel:${yol}` };
}

/** Siler; yol her zaman `public/yuklenenler` altında kalır (yol geçişi denemelerine karşı). */
export async function yerelSil(yol: string): Promise<void> {
  const tam = path.resolve(KOK, yol);
  if (!tam.startsWith(KOK + path.sep)) return;
  await unlink(tam).catch(() => {});
}
