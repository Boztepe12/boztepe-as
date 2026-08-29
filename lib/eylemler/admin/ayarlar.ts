"use server";

import { revalidatePath } from "next/cache";
import { eq, ne, and } from "drizzle-orm";
import { z } from "zod";

import { eylemIcinOturum } from "@/lib/auth/koruma";
import { oturumAc } from "@/lib/auth/oturum";
import { sifreDogrula, sifreKurallariniDenetle, sifreOzetle } from "@/lib/auth/sifre";
import { db } from "@/lib/db";
import { yoneticiler } from "@/lib/db/schema";
import { ayarKaydet } from "@/lib/sorgular/icerik";
import { sadelestir } from "@/lib/utils";

import type { EylemSonucu } from "./urun";

function alanHatalari(hata: z.ZodError): Record<string, string> {
  const alanlar: Record<string, string> = {};
  for (const sorun of hata.issues) {
    const alan = sorun.path.join(".");
    if (alan && !alanlar[alan]) alanlar[alan] = sorun.message;
  }
  return alanlar;
}

const metin = (azami: number) => z.string().trim().max(azami).default("");

/* ------------------------------------------------------------------ */
/* Ayar şemaları — vitrindeki tiplerle aynı biçimde                    */
/* ------------------------------------------------------------------ */

const IletisimSemasi = z.object({
  firmaAdi: z.string().trim().min(2, "Firma adını yazın.").max(200),
  kisaAd: z.string().trim().min(2, "Kısa adı yazın.").max(80),
  telefon: metin(40),
  whatsapp: metin(40),
  eposta: z.union([z.string().trim().email("Geçerli bir e-posta yazın."), z.literal("")]).default(""),
  adres: metin(400),
  haritaBaglantisi: metin(500),
  calismaSaatleri: z
    .array(z.object({ gun: metin(80), saat: metin(80) }))
    .max(10)
    .default([]),
});

const HakkimizdaSemasi = z.object({
  baslik: metin(200),
  kurulusYili: z.preprocess(
    (deger) => (typeof deger === "string" ? Number(deger) || 0 : deger),
    z.number().int().min(1800).max(2100),
  ),
  ozet: metin(1000),
  paragraflar: z.array(z.string().trim().max(4000)).max(20).default([]),
  degerler: z
    .array(z.object({ baslik: metin(120), metin: metin(400) }))
    .max(12)
    .default([]),
});

const DuyuruSemasi = z.object({
  aktif: z.boolean().default(false),
  metin: metin(300),
  baglanti: metin(300),
});

const SosyalSemasi = z.object({
  facebook: metin(300),
  instagram: metin(300),
});

const SeoSemasi = z.object({
  baslik: metin(200),
  aciklama: metin(400),
});

const SEMALAR = {
  iletisim: IletisimSemasi,
  hakkimizda: HakkimizdaSemasi,
  duyuru: DuyuruSemasi,
  sosyal: SosyalSemasi,
  seo: SeoSemasi,
} as const;

export type AyarAnahtari = keyof typeof SEMALAR;

/**
 * Tek bir ayar kümesini kaydeder. Her kümenin kendi şeması var; anahtar
 * doğrulanmadan hiçbir şey yazılmıyor ki panel dışından gelen bir çağrı
 * ayarlar tablosuna serbest veri koyamasın.
 */
export async function ayarlariKaydet(anahtar: string, deger: unknown): Promise<EylemSonucu> {
  await eylemIcinOturum();

  if (!(anahtar in SEMALAR)) return { durum: "hata", mesaj: "Bilinmeyen ayar." };

  const sema = SEMALAR[anahtar as AyarAnahtari];
  const cozum = sema.safeParse(deger);

  if (!cozum.success) {
    return {
      durum: "hata",
      mesaj: "Formda hatalı alanlar var.",
      alanlar: alanHatalari(cozum.error),
    };
  }

  /* Boş satırlar formda kalabiliyor; kaydederken temizliyoruz. */
  const veri = cozum.data as Record<string, unknown>;
  if (Array.isArray(veri.calismaSaatleri)) {
    veri.calismaSaatleri = (veri.calismaSaatleri as { gun: string; saat: string }[]).filter(
      (satir) => satir.gun || satir.saat,
    );
  }
  if (Array.isArray(veri.paragraflar)) {
    veri.paragraflar = (veri.paragraflar as string[]).filter((paragraf) => paragraf.trim() !== "");
  }
  if (Array.isArray(veri.degerler)) {
    veri.degerler = (veri.degerler as { baslik: string; metin: string }[]).filter(
      (satir) => satir.baslik || satir.metin,
    );
  }

  await ayarKaydet(anahtar, veri);

  /* Ayarlar başlık, altbilgi ve iletişim sayfasında kullanılıyor. */
  revalidatePath("/", "layout");
  revalidatePath("/admin/ayarlar");
  return { durum: "basarili", mesaj: "Ayarlar kaydedildi." };
}

/* ------------------------------------------------------------------ */
/* Hesap                                                               */
/* ------------------------------------------------------------------ */

const ProfilSemasi = z.object({
  adSoyad: z.string().trim().min(2, "Adınızı yazın.").max(120),
  eposta: z.string().trim().email("Geçerli bir e-posta yazın.").max(255),
});

export async function profilGuncelle(girdi: unknown): Promise<EylemSonucu> {
  const oturum = await eylemIcinOturum();

  const cozum = ProfilSemasi.safeParse(girdi);
  if (!cozum.success) {
    return {
      durum: "hata",
      mesaj: "Formda hatalı alanlar var.",
      alanlar: alanHatalari(cozum.error),
    };
  }

  /* E-posta girişte sadeleştirilmiş hâliyle aranıyor; aynı biçimde saklıyoruz. */
  const eposta = sadelestir(cozum.data.eposta);

  const cakisan = await db
    .select({ id: yoneticiler.id })
    .from(yoneticiler)
    .where(and(eq(yoneticiler.eposta, eposta), ne(yoneticiler.id, oturum.id)))
    .limit(1);

  if (cakisan.length > 0) {
    return {
      durum: "hata",
      mesaj: "Bu e-posta başka bir yönetici hesabında kullanılıyor.",
      alanlar: { eposta: "Bu e-posta kullanımda." },
    };
  }

  await db
    .update(yoneticiler)
    .set({ adSoyad: cozum.data.adSoyad, eposta, guncellemeTarihi: new Date() })
    .where(eq(yoneticiler.id, oturum.id));

  /* Oturum jetonu ad ve e-postayı taşıyor; değişikliğin panelde hemen görünmesi için
     jetonu yeniliyoruz. */
  await oturumAc({
    id: oturum.id,
    eposta,
    adSoyad: cozum.data.adSoyad,
    rol: oturum.rol,
  });

  revalidatePath("/admin", "layout");
  return { durum: "basarili", mesaj: "Hesap bilgileri güncellendi." };
}

const SifreSemasi = z
  .object({
    mevcut: z.string().min(1, "Mevcut şifrenizi yazın."),
    yeni: z.string().min(1, "Yeni şifrenizi yazın."),
    yeniTekrar: z.string().min(1, "Yeni şifreyi tekrar yazın."),
  })
  .refine((deger) => deger.yeni === deger.yeniTekrar, {
    message: "Yeni şifreler birbirini tutmuyor.",
    path: ["yeniTekrar"],
  });

export async function sifreDegistir(girdi: unknown): Promise<EylemSonucu> {
  const oturum = await eylemIcinOturum();

  const cozum = SifreSemasi.safeParse(girdi);
  if (!cozum.success) {
    return {
      durum: "hata",
      mesaj: "Formda hatalı alanlar var.",
      alanlar: alanHatalari(cozum.error),
    };
  }

  const kuralHatasi = sifreKurallariniDenetle(cozum.data.yeni);
  if (kuralHatasi) {
    return { durum: "hata", mesaj: kuralHatasi, alanlar: { yeni: kuralHatasi } };
  }

  const kayitlar = await db
    .select({ sifreOzeti: yoneticiler.sifreOzeti })
    .from(yoneticiler)
    .where(eq(yoneticiler.id, oturum.id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Hesap bulunamadı." };

  const dogru = await sifreDogrula(cozum.data.mevcut, kayitlar[0].sifreOzeti);
  if (!dogru) {
    return {
      durum: "hata",
      mesaj: "Mevcut şifreniz hatalı.",
      alanlar: { mevcut: "Mevcut şifreniz hatalı." },
    };
  }

  if (cozum.data.mevcut === cozum.data.yeni) {
    return {
      durum: "hata",
      mesaj: "Yeni şifre eskisiyle aynı olamaz.",
      alanlar: { yeni: "Yeni şifre eskisiyle aynı olamaz." },
    };
  }

  await db
    .update(yoneticiler)
    .set({ sifreOzeti: await sifreOzetle(cozum.data.yeni), guncellemeTarihi: new Date() })
    .where(eq(yoneticiler.id, oturum.id));

  return { durum: "basarili", mesaj: "Şifreniz değiştirildi." };
}
