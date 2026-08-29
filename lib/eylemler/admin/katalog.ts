"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { eylemIcinOturum } from "@/lib/auth/koruma";
import { db } from "@/lib/db";
import { kategoriler, markalar, urunler } from "@/lib/db/schema";
import { gorselSil, gorselYukle } from "@/lib/storage";
import { slugOlustur } from "@/lib/utils";

import type { EylemSonucu } from "./urun";

/* ------------------------------------------------------------------ */
/* Ortak yardımcılar                                                   */
/* ------------------------------------------------------------------ */

const bosaNull = (deger: unknown) => {
  if (typeof deger !== "string") return deger;
  const kirpik = deger.trim();
  return kirpik === "" ? null : kirpik;
};

const siraAlani = z.preprocess(
  (deger) => (typeof deger === "string" && deger.trim() !== "" ? Number(deger) : 0),
  z.number().int(),
);

const kimlikAlani = z.preprocess(
  (deger) => (typeof deger === "string" ? (deger.trim() === "" ? null : Number(deger)) : deger),
  z.union([z.number().int().positive(), z.null()]).optional(),
);

/**
 * Aynı slug başka bir kayıtta varsa sonuna sayı ekler. Kategori ve marka slug'ları
 * ayrı tablolarda benzersiz olduğu için tabloyu parametre alıyoruz.
 */
async function benzersizSlug(
  tablo: typeof kategoriler | typeof markalar,
  temel: string,
  haricId?: number,
): Promise<string> {
  const kok = slugOlustur(temel) || "kayit";

  for (let ek = 0; ek < 50; ek++) {
    const aday = ek === 0 ? kok : `${kok}-${ek + 1}`;
    const kosul = haricId ? and(eq(tablo.slug, aday), ne(tablo.id, haricId)) : eq(tablo.slug, aday);
    const mevcut = await db.select({ id: tablo.id }).from(tablo).where(kosul).limit(1);
    if (mevcut.length === 0) return aday;
  }

  return `${kok}-${Date.now().toString().slice(-6)}`;
}

function onbellekTazele() {
  /* Kategori ve marka menüde, ana sayfada ve listelerde görünüyor; kök yerleşimi
     tazelemek hepsini kapsıyor. */
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ */
/* Kategoriler                                                         */
/* ------------------------------------------------------------------ */

const KategoriSemasi = z.object({
  id: z.number().int().positive().optional(),
  ad: z.string().trim().min(2, "Kategori adı en az 2 karakter olmalı.").max(160),
  slug: z.preprocess(bosaNull, z.string().max(180).nullable()).optional(),
  aciklama: z.preprocess(bosaNull, z.string().max(2000).nullable()).optional(),
  ustKategoriId: kimlikAlani,
  sira: siraAlani,
  aktif: z.boolean().default(true),
  anaSayfadaGoster: z.boolean().default(false),
  seoBaslik: z.preprocess(bosaNull, z.string().max(200).nullable()).optional(),
  seoAciklama: z.preprocess(bosaNull, z.string().max(500).nullable()).optional(),
});

export async function kategoriKaydet(girdi: unknown): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const cozum = KategoriSemasi.safeParse(girdi);
  if (!cozum.success) {
    const alanlar: Record<string, string> = {};
    for (const sorun of cozum.error.issues) {
      const alan = sorun.path[0];
      if (typeof alan === "string" && !alanlar[alan]) alanlar[alan] = sorun.message;
    }
    return { durum: "hata", mesaj: "Formda hatalı alanlar var.", alanlar };
  }

  const v = cozum.data;

  /* Kategori kendi altına ya da kendi alt dalına taşınırsa menü sonsuz döngüye girer. */
  if (v.id && v.ustKategoriId) {
    if (v.ustKategoriId === v.id) {
      return {
        durum: "hata",
        mesaj: "Bir kategori kendi üst kategorisi olamaz.",
        alanlar: { ustKategoriId: "Kendi kendine bağlanamaz." },
      };
    }

    const altlar = await db
      .select({ id: kategoriler.id })
      .from(kategoriler)
      .where(eq(kategoriler.ustKategoriId, v.id));

    if (altlar.some((alt) => alt.id === v.ustKategoriId)) {
      return {
        durum: "hata",
        mesaj: "Bu kategori, seçtiğiniz kategorinin üstünde yer alıyor.",
        alanlar: { ustKategoriId: "Alt kategorisini üst kategori yapamazsınız." },
      };
    }
  }

  const slug = await benzersizSlug(kategoriler, v.slug ?? v.ad, v.id);

  const alanlar = {
    ad: v.ad,
    slug,
    aciklama: v.aciklama ?? null,
    ustKategoriId: v.ustKategoriId ?? null,
    sira: v.sira,
    aktif: v.aktif,
    anaSayfadaGoster: v.anaSayfadaGoster,
    seoBaslik: v.seoBaslik ?? null,
    seoAciklama: v.seoAciklama ?? null,
    guncellemeTarihi: new Date(),
  };

  let id: number;

  if (v.id) {
    const mevcut = await db
      .select({ id: kategoriler.id })
      .from(kategoriler)
      .where(eq(kategoriler.id, v.id))
      .limit(1);
    if (mevcut.length === 0) return { durum: "hata", mesaj: "Kategori bulunamadı." };

    await db.update(kategoriler).set(alanlar).where(eq(kategoriler.id, v.id));
    id = v.id;
  } else {
    const [yeni] = await db.insert(kategoriler).values(alanlar).returning({ id: kategoriler.id });
    id = yeni.id;
  }

  onbellekTazele();
  return { durum: "basarili", mesaj: v.id ? "Kategori güncellendi." : "Kategori eklendi.", id };
}

export async function kategoriSil(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select({ gorselKimligi: kategoriler.gorselKimligi })
    .from(kategoriler)
    .where(eq(kategoriler.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Kategori bulunamadı." };

  /*
   * Alt kategorinin üst bağlantısı veritabanı düzeyinde zorlanmıyor; silinen bir üstün
   * altları menüde kaybolur. Bu yüzden silmeden önce açıkça uyarıyoruz.
   */
  const [{ altAdedi }] = await db
    .select({ altAdedi: sql<number>`cast(count(*) as int)` })
    .from(kategoriler)
    .where(eq(kategoriler.ustKategoriId, id));

  if (altAdedi > 0) {
    return {
      durum: "hata",
      mesaj: `Bu kategorinin ${altAdedi} alt kategorisi var. Önce onları silin veya başka bir üst kategoriye taşıyın.`,
    };
  }

  const [{ urunAdedi }] = await db
    .select({ urunAdedi: sql<number>`cast(count(*) as int)` })
    .from(urunler)
    .where(eq(urunler.kategoriId, id));

  if (urunAdedi > 0) {
    return {
      durum: "hata",
      mesaj: `Bu kategoride ${urunAdedi} ürün var. Ürünleri başka kategoriye taşıyın ya da kategoriyi yayından kaldırın.`,
    };
  }

  await db.delete(kategoriler).where(eq(kategoriler.id, id));
  await gorselSil(kayitlar[0].gorselKimligi);

  onbellekTazele();
  revalidatePath("/admin/kategoriler");
  return { durum: "basarili", mesaj: "Kategori silindi." };
}

export async function kategoriGorseliYukle(id: number, veri: FormData): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const dosya = veri.get("dosya");
  if (!(dosya instanceof File)) return { durum: "hata", mesaj: "Dosya seçilmedi." };

  const kayitlar = await db
    .select({ gorselKimligi: kategoriler.gorselKimligi })
    .from(kategoriler)
    .where(eq(kategoriler.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Kategori bulunamadı." };

  try {
    const yuklenen = await gorselYukle(dosya, "kategoriler");

    await db
      .update(kategoriler)
      .set({ gorselUrl: yuklenen.url, gorselKimligi: yuklenen.kimlik, guncellemeTarihi: new Date() })
      .where(eq(kategoriler.id, id));

    /* Yeni görsel yerine geçtiği için eskisini depodan siliyoruz. */
    await gorselSil(kayitlar[0].gorselKimligi);

    onbellekTazele();
    revalidatePath(`/admin/kategoriler/${id}`);
    return { durum: "basarili", mesaj: "Görsel yüklendi." };
  } catch (hata) {
    return { durum: "hata", mesaj: hata instanceof Error ? hata.message : "Görsel yüklenemedi." };
  }
}

export async function kategoriGorseliKaldir(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select({ gorselKimligi: kategoriler.gorselKimligi })
    .from(kategoriler)
    .where(eq(kategoriler.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Kategori bulunamadı." };

  await db
    .update(kategoriler)
    .set({ gorselUrl: null, gorselKimligi: null, guncellemeTarihi: new Date() })
    .where(eq(kategoriler.id, id));

  await gorselSil(kayitlar[0].gorselKimligi);

  onbellekTazele();
  revalidatePath(`/admin/kategoriler/${id}`);
  return { durum: "basarili", mesaj: "Görsel kaldırıldı." };
}

/* ------------------------------------------------------------------ */
/* Markalar                                                            */
/* ------------------------------------------------------------------ */

const MarkaSemasi = z.object({
  id: z.number().int().positive().optional(),
  ad: z.string().trim().min(2, "Marka adı en az 2 karakter olmalı.").max(160),
  slug: z.preprocess(bosaNull, z.string().max(180).nullable()).optional(),
  aciklama: z.preprocess(bosaNull, z.string().max(2000).nullable()).optional(),
  sira: siraAlani,
  aktif: z.boolean().default(true),
});

export async function markaKaydet(girdi: unknown): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const cozum = MarkaSemasi.safeParse(girdi);
  if (!cozum.success) {
    const alanlar: Record<string, string> = {};
    for (const sorun of cozum.error.issues) {
      const alan = sorun.path[0];
      if (typeof alan === "string" && !alanlar[alan]) alanlar[alan] = sorun.message;
    }
    return { durum: "hata", mesaj: "Formda hatalı alanlar var.", alanlar };
  }

  const v = cozum.data;
  const slug = await benzersizSlug(markalar, v.slug ?? v.ad, v.id);

  const alanlar = {
    ad: v.ad,
    slug,
    aciklama: v.aciklama ?? null,
    sira: v.sira,
    aktif: v.aktif,
    guncellemeTarihi: new Date(),
  };

  let id: number;

  if (v.id) {
    const mevcut = await db
      .select({ id: markalar.id })
      .from(markalar)
      .where(eq(markalar.id, v.id))
      .limit(1);
    if (mevcut.length === 0) return { durum: "hata", mesaj: "Marka bulunamadı." };

    await db.update(markalar).set(alanlar).where(eq(markalar.id, v.id));
    id = v.id;
  } else {
    const [yeni] = await db.insert(markalar).values(alanlar).returning({ id: markalar.id });
    id = yeni.id;
  }

  onbellekTazele();
  return { durum: "basarili", mesaj: v.id ? "Marka güncellendi." : "Marka eklendi.", id };
}

export async function markaSil(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select({ logoKimligi: markalar.logoKimligi })
    .from(markalar)
    .where(eq(markalar.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Marka bulunamadı." };

  const [{ urunAdedi }] = await db
    .select({ urunAdedi: sql<number>`cast(count(*) as int)` })
    .from(urunler)
    .where(eq(urunler.markaId, id));

  if (urunAdedi > 0) {
    return {
      durum: "hata",
      mesaj: `Bu markaya bağlı ${urunAdedi} ürün var. Ürünlerin markasını değiştirin ya da markayı yayından kaldırın.`,
    };
  }

  await db.delete(markalar).where(eq(markalar.id, id));
  await gorselSil(kayitlar[0].logoKimligi);

  onbellekTazele();
  revalidatePath("/admin/markalar");
  return { durum: "basarili", mesaj: "Marka silindi." };
}

export async function markaLogosuYukle(id: number, veri: FormData): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const dosya = veri.get("dosya");
  if (!(dosya instanceof File)) return { durum: "hata", mesaj: "Dosya seçilmedi." };

  const kayitlar = await db
    .select({ logoKimligi: markalar.logoKimligi })
    .from(markalar)
    .where(eq(markalar.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Marka bulunamadı." };

  try {
    const yuklenen = await gorselYukle(dosya, "markalar");

    await db
      .update(markalar)
      .set({ logoUrl: yuklenen.url, logoKimligi: yuklenen.kimlik, guncellemeTarihi: new Date() })
      .where(eq(markalar.id, id));

    await gorselSil(kayitlar[0].logoKimligi);

    onbellekTazele();
    revalidatePath(`/admin/markalar/${id}`);
    return { durum: "basarili", mesaj: "Logo yüklendi." };
  } catch (hata) {
    return { durum: "hata", mesaj: hata instanceof Error ? hata.message : "Logo yüklenemedi." };
  }
}

export async function markaLogosuKaldir(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select({ logoKimligi: markalar.logoKimligi })
    .from(markalar)
    .where(eq(markalar.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Marka bulunamadı." };

  await db
    .update(markalar)
    .set({ logoUrl: null, logoKimligi: null, guncellemeTarihi: new Date() })
    .where(eq(markalar.id, id));

  await gorselSil(kayitlar[0].logoKimligi);

  onbellekTazele();
  revalidatePath(`/admin/markalar/${id}`);
  return { durum: "basarili", mesaj: "Logo kaldırıldı." };
}

/** Listeden hızlı yayına alma / yayından kaldırma. */
export async function katalogDurumDegistir(
  tur: "kategori" | "marka",
  id: number,
  alan: "aktif" | "anaSayfadaGoster",
  deger: boolean,
): Promise<EylemSonucu> {
  await eylemIcinOturum();

  if (tur === "marka") {
    if (alan !== "aktif") return { durum: "hata", mesaj: "Bu alan markalarda yok." };
    await db
      .update(markalar)
      .set({ aktif: deger, guncellemeTarihi: new Date() })
      .where(eq(markalar.id, id));
    revalidatePath("/admin/markalar");
  } else {
    await db
      .update(kategoriler)
      .set({ [alan]: deger, guncellemeTarihi: new Date() })
      .where(eq(kategoriler.id, id));
    revalidatePath("/admin/kategoriler");
  }

  onbellekTazele();
  return { durum: "basarili" };
}
