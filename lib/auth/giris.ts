"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { yoneticiler } from "@/lib/db/schema";
import { oturumAc, oturumKapat } from "@/lib/auth/oturum";
import { sifreDogrula } from "@/lib/auth/sifre";
import { sadelestir } from "@/lib/utils";

const GirisSemasi = z.object({
  eposta: z.string().trim().email("Geçerli bir e-posta adresi girin."),
  sifre: z.string().min(1, "Şifrenizi girin."),
});

export type GirisSonucu = { durum: "hata"; mesaj: string } | { durum: "basarili" };

/*
 * Basit, bellek içi deneme sayacı. Vercel'de her sunucu örneğinin kendi sayacı olur,
 * yani bu tek başına eksiksiz bir koruma değil — amacı otomatik deneme araçlarını
 * yavaşlatmak. Asıl koruma bcrypt maliyeti (12) ve güçlü şifre kuralı.
 */
const denemeler = new Map<string, { adet: number; sonDeneme: number }>();
const PENCERE_MS = 15 * 60 * 1000;
const AZAMI_DENEME = 8;

function denemeHakkiVar(anahtar: string): boolean {
  const kayit = denemeler.get(anahtar);
  if (!kayit) return true;
  if (Date.now() - kayit.sonDeneme > PENCERE_MS) {
    denemeler.delete(anahtar);
    return true;
  }
  return kayit.adet < AZAMI_DENEME;
}

function denemeKaydet(anahtar: string) {
  const kayit = denemeler.get(anahtar);
  if (!kayit || Date.now() - kayit.sonDeneme > PENCERE_MS) {
    denemeler.set(anahtar, { adet: 1, sonDeneme: Date.now() });
    return;
  }
  kayit.adet += 1;
  kayit.sonDeneme = Date.now();
}

export async function girisYap(_oncekiDurum: unknown, veri: FormData): Promise<GirisSonucu> {
  const cozum = GirisSemasi.safeParse({
    eposta: veri.get("eposta"),
    sifre: veri.get("sifre"),
  });

  if (!cozum.success) {
    return { durum: "hata", mesaj: cozum.error.issues[0]?.message ?? "Bilgiler eksik." };
  }

  const eposta = sadelestir(cozum.data.eposta);

  if (!denemeHakkiVar(eposta)) {
    return {
      durum: "hata",
      mesaj: "Çok fazla hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.",
    };
  }

  const kayitlar = await db
    .select()
    .from(yoneticiler)
    .where(eq(yoneticiler.eposta, eposta))
    .limit(1);

  const yonetici = kayitlar[0];

  /*
   * Kullanıcı bulunamadığında da şifre karşılaştırması yapıyoruz. Aksi halde yanıt
   * süresi farkı, hangi e-postaların kayıtlı olduğunu ele verir.
   */
  const sahteOzet = "$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012";
  const dogru = await sifreDogrula(cozum.data.sifre, yonetici?.sifreOzeti ?? sahteOzet);

  if (!yonetici || !dogru || !yonetici.aktif) {
    denemeKaydet(eposta);
    return { durum: "hata", mesaj: "E-posta veya şifre hatalı." };
  }

  denemeler.delete(eposta);

  await db
    .update(yoneticiler)
    .set({ sonGirisTarihi: new Date() })
    .where(eq(yoneticiler.id, yonetici.id));

  await oturumAc({
    id: yonetici.id,
    eposta: yonetici.eposta,
    adSoyad: yonetici.adSoyad,
    rol: yonetici.rol,
  });

  return { durum: "basarili" };
}

export async function cikisYap() {
  await oturumKapat();
  redirect("/admin/giris");
}
