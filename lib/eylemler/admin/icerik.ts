"use server";

import { revalidatePath } from "next/cache";
import { eq, max } from "drizzle-orm";
import { z } from "zod";

import { eylemIcinOturum } from "@/lib/auth/koruma";
import { db } from "@/lib/db";
import { afisler, bankaHesaplari, galeriGorselleri } from "@/lib/db/schema";
import { gorselSil, gorselYukle } from "@/lib/storage";

import type { EylemSonucu } from "./urun";

const bosaNull = (deger: unknown) => {
  if (typeof deger !== "string") return deger;
  const kirpik = deger.trim();
  return kirpik === "" ? null : kirpik;
};

const siraAlani = z.preprocess(
  (deger) => (typeof deger === "string" && deger.trim() !== "" ? Number(deger) : 0),
  z.number().int(),
);

/** Tarih alanları formdan "2026-09-01" biçiminde geliyor; boşsa süresiz demek. */
const tarihAlani = z.preprocess((deger) => {
  if (deger instanceof Date) return deger;
  if (typeof deger !== "string" || deger.trim() === "") return null;
  const tarih = new Date(deger);
  return Number.isNaN(tarih.getTime()) ? undefined : tarih;
}, z.union([z.date(), z.null()]).optional());

function alanHatalari(hata: z.ZodError): Record<string, string> {
  const alanlar: Record<string, string> = {};
  for (const sorun of hata.issues) {
    const alan = sorun.path[0];
    if (typeof alan === "string" && !alanlar[alan]) alanlar[alan] = sorun.message;
  }
  return alanlar;
}

function anaSayfayiTazele() {
  revalidatePath("/", "layout");
  revalidatePath("/kampanyalar");
}

/* ------------------------------------------------------------------ */
/* Afişler                                                             */
/* ------------------------------------------------------------------ */

const AfisSemasi = z
  .object({
    id: z.number().int().positive().optional(),
    baslik: z.string().trim().min(2, "Afiş başlığı en az 2 karakter olmalı.").max(200),
    altBaslik: z.preprocess(bosaNull, z.string().max(300).nullable()).optional(),
    baglanti: z.preprocess(bosaNull, z.string().max(500).nullable()).optional(),
    butonMetni: z.preprocess(bosaNull, z.string().max(80).nullable()).optional(),
    sira: siraAlani,
    aktif: z.boolean().default(true),
    baslangicTarihi: tarihAlani,
    bitisTarihi: tarihAlani,
  })
  .refine(
    (deger) =>
      !deger.baslangicTarihi ||
      !deger.bitisTarihi ||
      deger.baslangicTarihi <= deger.bitisTarihi,
    { message: "Bitiş tarihi başlangıçtan önce olamaz.", path: ["bitisTarihi"] },
  );

export async function afisKaydet(girdi: unknown): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const cozum = AfisSemasi.safeParse(girdi);
  if (!cozum.success) {
    return {
      durum: "hata",
      mesaj: "Formda hatalı alanlar var.",
      alanlar: alanHatalari(cozum.error),
    };
  }

  const v = cozum.data;
  const alanlar = {
    baslik: v.baslik,
    altBaslik: v.altBaslik ?? null,
    baglanti: v.baglanti ?? null,
    butonMetni: v.butonMetni ?? null,
    sira: v.sira,
    aktif: v.aktif,
    baslangicTarihi: v.baslangicTarihi ?? null,
    bitisTarihi: v.bitisTarihi ?? null,
    guncellemeTarihi: new Date(),
  };

  let id: number;

  if (v.id) {
    const mevcut = await db
      .select({ id: afisler.id })
      .from(afisler)
      .where(eq(afisler.id, v.id))
      .limit(1);
    if (mevcut.length === 0) return { durum: "hata", mesaj: "Afiş bulunamadı." };

    await db.update(afisler).set(alanlar).where(eq(afisler.id, v.id));
    id = v.id;
  } else {
    const [yeni] = await db.insert(afisler).values(alanlar).returning({ id: afisler.id });
    id = yeni.id;
  }

  anaSayfayiTazele();
  revalidatePath("/admin/afisler");
  return { durum: "basarili", mesaj: v.id ? "Afiş güncellendi." : "Afiş eklendi.", id };
}

export async function afisSil(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db.select().from(afisler).where(eq(afisler.id, id)).limit(1);
  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Afiş bulunamadı." };

  await db.delete(afisler).where(eq(afisler.id, id));
  await Promise.all([
    gorselSil(kayitlar[0].gorselKimligi),
    gorselSil(kayitlar[0].mobilGorselKimligi),
  ]);

  anaSayfayiTazele();
  revalidatePath("/admin/afisler");
  return { durum: "basarili", mesaj: "Afiş silindi." };
}

export async function afisDurumDegistir(id: number, deger: boolean): Promise<EylemSonucu> {
  await eylemIcinOturum();

  await db
    .update(afisler)
    .set({ aktif: deger, guncellemeTarihi: new Date() })
    .where(eq(afisler.id, id));

  anaSayfayiTazele();
  revalidatePath("/admin/afisler");
  return { durum: "basarili" };
}

/** Afişin masaüstü ya da mobil görselini değiştirir. */
export async function afisGorseliYukle(
  id: number,
  veri: FormData,
): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const dosya = veri.get("dosya");
  if (!(dosya instanceof File)) return { durum: "hata", mesaj: "Dosya seçilmedi." };

  const mobilMi = veri.get("mobil") === "1";

  const kayitlar = await db.select().from(afisler).where(eq(afisler.id, id)).limit(1);
  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Afiş bulunamadı." };

  try {
    const yuklenen = await gorselYukle(dosya, "afisler");
    const eskiKimlik = mobilMi ? kayitlar[0].mobilGorselKimligi : kayitlar[0].gorselKimligi;

    await db
      .update(afisler)
      .set(
        mobilMi
          ? {
              mobilGorselUrl: yuklenen.url,
              mobilGorselKimligi: yuklenen.kimlik,
              guncellemeTarihi: new Date(),
            }
          : {
              gorselUrl: yuklenen.url,
              gorselKimligi: yuklenen.kimlik,
              guncellemeTarihi: new Date(),
            },
      )
      .where(eq(afisler.id, id));

    await gorselSil(eskiKimlik);

    anaSayfayiTazele();
    revalidatePath(`/admin/afisler/${id}`);
    return { durum: "basarili", mesaj: "Görsel yüklendi." };
  } catch (hata) {
    return { durum: "hata", mesaj: hata instanceof Error ? hata.message : "Görsel yüklenemedi." };
  }
}

export async function afisGorseliKaldir(id: number, mobilMi = false): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db.select().from(afisler).where(eq(afisler.id, id)).limit(1);
  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Afiş bulunamadı." };

  const eskiKimlik = mobilMi ? kayitlar[0].mobilGorselKimligi : kayitlar[0].gorselKimligi;

  await db
    .update(afisler)
    .set(
      mobilMi
        ? { mobilGorselUrl: null, mobilGorselKimligi: null, guncellemeTarihi: new Date() }
        : { gorselUrl: null, gorselKimligi: null, guncellemeTarihi: new Date() },
    )
    .where(eq(afisler.id, id));

  await gorselSil(eskiKimlik);

  anaSayfayiTazele();
  revalidatePath(`/admin/afisler/${id}`);
  return { durum: "basarili", mesaj: "Görsel kaldırıldı." };
}

/* ------------------------------------------------------------------ */
/* Galeri                                                              */
/* ------------------------------------------------------------------ */

export async function galeriGorseliYukle(veri: FormData): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const dosya = veri.get("dosya");
  if (!(dosya instanceof File)) return { durum: "hata", mesaj: "Dosya seçilmedi." };

  const baslik = veri.get("baslik");

  try {
    const yuklenen = await gorselYukle(dosya, "galeri");

    const [sonuc] = await db
      .select({ enBuyuk: max(galeriGorselleri.sira) })
      .from(galeriGorselleri);

    await db.insert(galeriGorselleri).values({
      baslik: typeof baslik === "string" && baslik.trim() !== "" ? baslik.trim() : null,
      url: yuklenen.url,
      depoKimligi: yuklenen.kimlik,
      sira: (sonuc?.enBuyuk ?? -1) + 1,
    });

    revalidatePath("/galeri");
    revalidatePath("/admin/galeri");
    return { durum: "basarili", mesaj: "Görsel yüklendi." };
  } catch (hata) {
    return { durum: "hata", mesaj: hata instanceof Error ? hata.message : "Görsel yüklenemedi." };
  }
}

export async function galeriGorseliGuncelle(
  id: number,
  baslik: string,
  aktif: boolean,
): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kirpik = baslik.trim();
  if (kirpik.length > 200) return { durum: "hata", mesaj: "Başlık en fazla 200 karakter olabilir." };

  const kayitlar = await db
    .select({ id: galeriGorselleri.id })
    .from(galeriGorselleri)
    .where(eq(galeriGorselleri.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Görsel bulunamadı." };

  await db
    .update(galeriGorselleri)
    .set({ baslik: kirpik || null, aktif })
    .where(eq(galeriGorselleri.id, id));

  revalidatePath("/galeri");
  revalidatePath("/admin/galeri");
  return { durum: "basarili", mesaj: "Kaydedildi." };
}

export async function galeriGorseliSil(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select()
    .from(galeriGorselleri)
    .where(eq(galeriGorselleri.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Görsel bulunamadı." };

  await db.delete(galeriGorselleri).where(eq(galeriGorselleri.id, id));
  await gorselSil(kayitlar[0].depoKimligi);

  revalidatePath("/galeri");
  revalidatePath("/admin/galeri");
  return { durum: "basarili", mesaj: "Görsel silindi." };
}

export async function galeriGorseliTasi(
  id: number,
  yon: "yukari" | "asagi",
): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const tumu = await db
    .select()
    .from(galeriGorselleri)
    .orderBy(galeriGorselleri.sira, galeriGorselleri.id);

  const indeks = tumu.findIndex((gorsel) => gorsel.id === id);
  if (indeks === -1) return { durum: "hata", mesaj: "Görsel bulunamadı." };

  const hedef = yon === "yukari" ? indeks - 1 : indeks + 1;
  if (hedef < 0 || hedef >= tumu.length) return { durum: "basarili" };

  const yeniSira = [...tumu];
  [yeniSira[indeks], yeniSira[hedef]] = [yeniSira[hedef], yeniSira[indeks]];

  /* Sıra numaralarını baştan yazmak, eşit ya da boşluklu değerlerde de doğru sonuç verir. */
  for (const [sira, kayit] of yeniSira.entries()) {
    await db.update(galeriGorselleri).set({ sira }).where(eq(galeriGorselleri.id, kayit.id));
  }

  revalidatePath("/galeri");
  revalidatePath("/admin/galeri");
  return { durum: "basarili" };
}

/* ------------------------------------------------------------------ */
/* Banka hesapları                                                     */
/* ------------------------------------------------------------------ */

/*
 * IBAN'ı boşluksuz ve büyük harfle saklıyoruz; gösterirken `ibanBicimle`
 * dörderli gruplara ayırıyor. Türkiye IBAN'ı TR + 24 hane.
 */
const IbanSemasi = z
  .string()
  .trim()
  .transform((deger) => deger.replace(/\s/g, "").toUpperCase())
  .refine((deger) => /^TR\d{24}$/.test(deger), "IBAN 'TR' ile başlamalı ve 26 karakter olmalı.");

const BankaSemasi = z.object({
  id: z.number().int().positive().optional(),
  bankaAdi: z.string().trim().min(2, "Banka adını yazın.").max(120),
  hesapSahibi: z.string().trim().min(2, "Hesap sahibini yazın.").max(200),
  iban: IbanSemasi,
  sube: z.preprocess(bosaNull, z.string().max(120).nullable()).optional(),
  sira: siraAlani,
  aktif: z.boolean().default(true),
});

export async function bankaHesabiKaydet(girdi: unknown): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const cozum = BankaSemasi.safeParse(girdi);
  if (!cozum.success) {
    return {
      durum: "hata",
      mesaj: "Formda hatalı alanlar var.",
      alanlar: alanHatalari(cozum.error),
    };
  }

  const v = cozum.data;
  const alanlar = {
    bankaAdi: v.bankaAdi,
    hesapSahibi: v.hesapSahibi,
    iban: v.iban,
    sube: v.sube ?? null,
    sira: v.sira,
    aktif: v.aktif,
    guncellemeTarihi: new Date(),
  };

  let id: number;

  if (v.id) {
    const mevcut = await db
      .select({ id: bankaHesaplari.id })
      .from(bankaHesaplari)
      .where(eq(bankaHesaplari.id, v.id))
      .limit(1);
    if (mevcut.length === 0) return { durum: "hata", mesaj: "Hesap bulunamadı." };

    await db.update(bankaHesaplari).set(alanlar).where(eq(bankaHesaplari.id, v.id));
    id = v.id;
  } else {
    const [yeni] = await db
      .insert(bankaHesaplari)
      .values(alanlar)
      .returning({ id: bankaHesaplari.id });
    id = yeni.id;
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/banka");
  return { durum: "basarili", mesaj: v.id ? "Hesap güncellendi." : "Hesap eklendi.", id };
}

export async function bankaHesabiSil(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select({ id: bankaHesaplari.id })
    .from(bankaHesaplari)
    .where(eq(bankaHesaplari.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Hesap bulunamadı." };

  await db.delete(bankaHesaplari).where(eq(bankaHesaplari.id, id));

  revalidatePath("/", "layout");
  revalidatePath("/admin/banka");
  return { durum: "basarili", mesaj: "Hesap silindi." };
}

/*
 * Afiş görseli için iki ayrı alan var (masaüstü ve mobil). Arayüzdeki tekil görsel
 * bileşeni tek bir yükleme/kaldırma çifti beklediği için ince sarmalayıcılar
 * yazıyoruz; böylece bileşene ek parametre taşımak gerekmiyor.
 */
export async function afisMasaustuGorseliYukle(id: number, veri: FormData): Promise<EylemSonucu> {
  veri.set("mobil", "0");
  return afisGorseliYukle(id, veri);
}

export async function afisMobilGorseliYukle(id: number, veri: FormData): Promise<EylemSonucu> {
  veri.set("mobil", "1");
  return afisGorseliYukle(id, veri);
}

export async function afisMasaustuGorseliKaldir(id: number): Promise<EylemSonucu> {
  return afisGorseliKaldir(id, false);
}

export async function afisMobilGorseliKaldir(id: number): Promise<EylemSonucu> {
  return afisGorseliKaldir(id, true);
}
