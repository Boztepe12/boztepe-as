import { createClient } from "@supabase/supabase-js";

/**
 * Canlı sürücü: Supabase Storage, herkese açık "site" kovası (bucket). Kova
 * `drizzle/0005_depo_kovasi.sql` ile kurulur: yalnız görsel ve PDF türleri, dosya
 * başına 50 MB — bu kuralları Supabase'in kendisi uygular.
 *
 *   SUPABASE_URL          https://<proje>.supabase.co
 *   SUPABASE_SECRET_KEY   Project Settings → API Keys → secret (sb_secret_…), sunucuda kalır
 *   SUPABASE_BUCKET       isteğe bağlı, varsayılan "site"
 *
 * Kimlik: `sb:<yol>`. Dosyanın adresi kovanın herkese açık adresidir.
 */

const url = process.env.SUPABASE_URL?.trim();
const anahtar = process.env.SUPABASE_SECRET_KEY?.trim();
export const KOVA = process.env.SUPABASE_BUCKET?.trim() || "site";

export const supabaseHazir = Boolean(url && anahtar);

let istemci: ReturnType<typeof createClient> | null = null;
function kova() {
  istemci ??= createClient(url!, anahtar!, { auth: { persistSession: false, autoRefreshToken: false } });
  return istemci.storage.from(KOVA);
}

function adres(yol: string): string {
  return kova().getPublicUrl(yol).data.publicUrl;
}

export async function supabaseYaz(yol: string, dosya: File): Promise<{ url: string; kimlik: string }> {
  const { error } = await kova().upload(yol, dosya, { contentType: dosya.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Dosya depoya yüklenemedi: ${error.message}`);
  return { url: adres(yol), kimlik: `sb:${yol}` };
}

/**
 * Tarayıcının dosyayı doğrudan depoya yüklemesi için tek kullanımlık adres (2 saat
 * geçerli). Büyük PDF'ler sunucudan geçmez: Vercel fonksiyonları ~4.5 MB'tan büyük
 * isteği almaz.
 */
export async function supabaseYuklemeAdresi(yol: string): Promise<{ yuklemeAdresi: string; url: string; kimlik: string }> {
  const { data, error } = await kova().createSignedUploadUrl(yol);
  if (error || !data) throw new Error(`Yükleme izni alınamadı: ${error?.message ?? "bilinmeyen hata"}`);
  return { yuklemeAdresi: data.signedUrl, url: adres(yol), kimlik: `sb:${yol}` };
}

export async function supabaseSil(yol: string): Promise<void> {
  await kova().remove([yol]);
}
