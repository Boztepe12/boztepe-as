"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { eylemIcinOturum } from "@/lib/auth/koruma";
import { db } from "@/lib/db";
import { kataloglar } from "@/lib/db/schema";
import { dosyaSil, gorselYukle, KATALOG_PDF_KIMLIGI, pdfYuklemeHazirla } from "@/lib/storage";

import type { EylemSonucu } from "./urun";

/*
 * Kataloglar: markaların PDF katalogları ya da online katalog sayfalarına
 * bağlantılar; sitede /kataloglar'da gruplanmış kartlar olarak görünür.
 *
 * PDF büyük olabildiği için sunucu eyleminden geçmez: tarayıcı önce
 * katalogPdfYuklemeHazirla() ile tek kullanımlık bir yükleme adresi alıp dosyayı
 * doğrudan depoya (Supabase Storage) yükler — yerelde /api/admin/katalog-pdf'e
 * gönderir —, sonra katalogKaydet() dosyanın adresini ve depo kimliğini kaydeder.
 */

const bosaNull = (deger: unknown) => {
  if (typeof deger !== "string") return deger;
  const kirpik = deger.trim();
  return kirpik === "" ? null : kirpik;
};

const siraAlani = z.preprocess(
  (deger) => (typeof deger === "string" && deger.trim() !== "" ? Number(deger) : typeof deger === "number" ? deger : 0),
  z.number().int(),
);


const KatalogSemasi = z
  .object({
    id: z.number().int().positive().optional(),
    baslik: z.string().trim().min(2, "Katalog başlığı en az 2 karakter olmalı.").max(160),
    grup: z.preprocess(bosaNull, z.string().max(80).nullable()).optional(),
    aciklama: z.preprocess(bosaNull, z.string().max(1000).nullable()).optional(),
    tur: z.enum(["pdf", "baglanti"]),
    baglanti: z.preprocess(bosaNull, z.string().max(1000).nullable()).optional(),
    dosyaKimligi: z.preprocess(bosaNull, z.string().max(300).nullable()).optional(),
    dosyaAdi: z.preprocess(bosaNull, z.string().max(240).nullable()).optional(),
    dosyaBoyutu: z.number().int().nonnegative().nullable().optional(),
    sira: siraAlani,
    aktif: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.tur === "baglanti") {
      if (!v.baglanti || !/^https?:\/\/[^\s]+$/i.test(v.baglanti)) {
        ctx.addIssue({ code: "custom", path: ["baglanti"], message: "https:// ile başlayan bir adres girin." });
      }
    } else {
      if (!v.dosyaKimligi || !v.baglanti) {
        ctx.addIssue({ code: "custom", path: ["dosya"], message: "Bir PDF dosyası seçin." });
      } else if (!KATALOG_PDF_KIMLIGI.test(v.dosyaKimligi)) {
        ctx.addIssue({ code: "custom", path: ["dosya"], message: "Dosya tanınmadı; yeniden yükleyin." });
      }
    }
  });

function alanHatalari(hata: z.ZodError): Record<string, string> {
  const alanlar: Record<string, string> = {};
  for (const sorun of hata.issues) {
    const alan = sorun.path[0];
    if (typeof alan === "string" && !alanlar[alan]) alanlar[alan] = sorun.message;
  }
  return alanlar;
}

function tazele(id?: number) {
  revalidatePath("/kataloglar");
  revalidatePath("/admin/kataloglar");
  if (id) revalidatePath(`/admin/kataloglar/${id}`);
}

/** PDF yüklemesini hazırlar: canlıda doğrudan depoya yükleme adresi, yerelde { yerel: true }. */
export async function katalogPdfYuklemeHazirla() {
  await eylemIcinOturum();
  return pdfYuklemeHazirla();
}

export async function katalogKaydet(girdi: unknown): Promise<EylemSonucu> {
  await eylemIcinOturum();
  const cozum = KatalogSemasi.safeParse(girdi);
  if (!cozum.success) {
    return { durum: "hata", mesaj: "Formda hatalı alanlar var.", alanlar: alanHatalari(cozum.error) };
  }
  const v = cozum.data;
  const pdf = v.tur === "pdf";
  const alanlar = {
    baslik: v.baslik,
    grup: v.grup ?? null,
    aciklama: v.aciklama ?? null,
    tur: v.tur,
    baglanti: v.baglanti ?? null,
    dosyaKimligi: pdf ? (v.dosyaKimligi ?? null) : null,
    dosyaAdi: pdf ? (v.dosyaAdi ?? null) : null,
    dosyaBoyutu: pdf ? (v.dosyaBoyutu ?? null) : null,
    sira: v.sira,
    aktif: v.aktif,
    guncellemeTarihi: new Date(),
  };

  if (v.id) {
    const eski = (await db.select().from(kataloglar).where(eq(kataloglar.id, v.id)).limit(1))[0];
    if (!eski) return { durum: "hata", mesaj: "Katalog bulunamadı." };
    await db.update(kataloglar).set(alanlar).where(eq(kataloglar.id, v.id));
    // PDF değiştiyse ya da bağlantıya çevrildiyse eski dosya depoda kalmasın.
    if (eski.dosyaKimligi && eski.dosyaKimligi !== alanlar.dosyaKimligi) await dosyaSil(eski.dosyaKimligi);
    tazele(v.id);
    return { durum: "basarili", mesaj: "Katalog güncellendi.", id: v.id };
  }
  const [yeni] = await db.insert(kataloglar).values(alanlar).returning({ id: kataloglar.id });
  tazele(yeni.id);
  return { durum: "basarili", mesaj: "Katalog eklendi.", id: yeni.id };
}

export async function katalogSil(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();
  const kayit = (await db.select().from(kataloglar).where(eq(kataloglar.id, id)).limit(1))[0];
  if (!kayit) return { durum: "hata", mesaj: "Katalog bulunamadı." };
  await db.delete(kataloglar).where(eq(kataloglar.id, id));
  await Promise.all([dosyaSil(kayit.dosyaKimligi), dosyaSil(kayit.kapakKimligi)]);
  tazele();
  return { durum: "basarili", mesaj: "Katalog silindi." };
}

export async function katalogDurumu(id: number, aktif: boolean): Promise<EylemSonucu> {
  await eylemIcinOturum();
  await db.update(kataloglar).set({ aktif, guncellemeTarihi: new Date() }).where(eq(kataloglar.id, id));
  tazele(id);
  return { durum: "basarili" };
}

/** Kapak görseli (ya da markanın logosu). */
export async function katalogKapagiYukle(id: number, veri: FormData): Promise<EylemSonucu> {
  await eylemIcinOturum();
  const dosya = veri.get("dosya");
  if (!(dosya instanceof File)) return { durum: "hata", mesaj: "Dosya seçilmedi." };
  const kayit = (await db.select().from(kataloglar).where(eq(kataloglar.id, id)).limit(1))[0];
  if (!kayit) return { durum: "hata", mesaj: "Katalog bulunamadı." };
  try {
    const yuklenen = await gorselYukle(dosya, "kataloglar");
    await db.update(kataloglar).set({ kapakUrl: yuklenen.url, kapakKimligi: yuklenen.kimlik, guncellemeTarihi: new Date() })
      .where(eq(kataloglar.id, id));
    await dosyaSil(kayit.kapakKimligi);
    tazele(id);
    return { durum: "basarili", mesaj: "Kapak görseli yüklendi." };
  } catch (hata) {
    return { durum: "hata", mesaj: hata instanceof Error ? hata.message : "Görsel yüklenemedi." };
  }
}

export async function katalogKapagiKaldir(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();
  const kayit = (await db.select().from(kataloglar).where(eq(kataloglar.id, id)).limit(1))[0];
  if (!kayit) return { durum: "hata", mesaj: "Katalog bulunamadı." };
  await db.update(kataloglar).set({ kapakUrl: null, kapakKimligi: null, guncellemeTarihi: new Date() }).where(eq(kataloglar.id, id));
  await dosyaSil(kayit.kapakKimligi);
  tazele(id);
  return { durum: "basarili", mesaj: "Kapak görseli kaldırıldı." };
}
