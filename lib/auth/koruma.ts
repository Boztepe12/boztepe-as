import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { yoneticiler } from "@/lib/db/schema";
import { mevcutOturum, oturumKapat, type OturumBilgisi } from "@/lib/auth/oturum";

/**
 * Korumalı sayfaların giriş noktası. Oturum yoksa giriş ekranına yönlendirir.
 *
 * Bu kontrol bilerek middleware'de değil, sunucu bileşeninde yapılıyor. Next.js'in
 * middleware katmanı geçmişte başlık hilesiyle atlatılabilmişti (CVE-2025-29927);
 * yetkilendirmeyi verinin okunduğu yere en yakın noktada doğrulamak daha güvenli.
 * Middleware yalnızca kullanıcıyı erkenden yönlendirmek için, ek kolaylık olarak var.
 */
export async function oturumZorunlu(donusYolu?: string): Promise<OturumBilgisi> {
  const oturum = await mevcutOturum();

  if (!oturum) {
    const hedef = donusYolu ? `/admin/giris?donus=${encodeURIComponent(donusYolu)}` : "/admin/giris";
    redirect(hedef);
  }

  /*
   * Jeton geçerli olsa bile hesap askıya alınmış ya da silinmiş olabilir. Yönetici
   * sayısı az olduğu için bu ek sorgunun maliyeti ihmal edilebilir; karşılığında
   * pasifleştirilen bir hesap bir sonraki istekte anında kapı dışında kalıyor.
   */
  const kayitlar = await db
    .select({ aktif: yoneticiler.aktif, rol: yoneticiler.rol, adSoyad: yoneticiler.adSoyad })
    .from(yoneticiler)
    .where(eq(yoneticiler.id, oturum.id))
    .limit(1);

  const kayit = kayitlar[0];
  if (!kayit || !kayit.aktif) {
    await oturumKapat();
    redirect("/admin/giris");
  }

  /* Rol ve ad jetondan sonra değişmiş olabilir; güncel değeri kullan. */
  return { ...oturum, rol: kayit.rol, adSoyad: kayit.adSoyad };
}

/** Yalnızca admin rolünün erişebileceği işlemler için. */
export async function adminZorunlu(): Promise<OturumBilgisi> {
  const oturum = await oturumZorunlu();
  if (oturum.rol !== "admin") {
    redirect("/admin?yetki=yok");
  }
  return oturum;
}

/**
 * Sunucu eylemlerinde kullanılan koruma. Sayfa yönlendirmesi yerine hata fırlatır;
 * eylemler kendi hata mesajlarını döndürebilsin diye.
 */
export async function eylemIcinOturum(): Promise<OturumBilgisi> {
  const oturum = await mevcutOturum();
  if (!oturum) throw new Error("Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.");
  return oturum;
}
