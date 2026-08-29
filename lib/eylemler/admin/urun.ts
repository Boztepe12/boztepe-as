"use server";

import { revalidatePath } from "next/cache";
import { and, eq, max, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { eylemIcinOturum } from "@/lib/auth/koruma";
import { db } from "@/lib/db";
import {
  kategoriler,
  markalar,
  urunGorselleri,
  urunOzellikleri,
  urunler,
} from "@/lib/db/schema";
import { gorselSil, gorselYukle } from "@/lib/storage";
import { sadelestir, slugOlustur } from "@/lib/utils";

export type EylemSonucu =
  | { durum: "basarili"; mesaj?: string; id?: number }
  | { durum: "hata"; mesaj: string; alanlar?: Record<string, string> };

/* Boş metin alanları veritabanında null olmalı; "" ile null karışırsa sorgular şaşar. */
const bosaNull = (deger: unknown) => {
  if (typeof deger !== "string") return deger;
  const kirpik = deger.trim();
  return kirpik === "" ? null : kirpik;
};

const paraAlani = z
  .preprocess((d) => {
    if (typeof d !== "string") return d;
    const temiz = d.trim().replace(/\./g, "").replace(",", ".");
    return temiz === "" ? null : temiz;
  }, z.union([z.string().regex(/^\d+(\.\d{1,2})?$/, "Geçerli bir tutar girin."), z.null()]))
  .optional();

const sayiAlani = z
  .preprocess((d) => {
    if (typeof d !== "string") return d;
    return d.trim() === "" ? null : Number(d);
  }, z.union([z.number().int().min(0), z.null()]))
  .optional();

const UrunSemasi = z.object({
  id: z.number().int().positive().optional(),
  ad: z.string().trim().min(2, "Ürün adı en az 2 karakter olmalı.").max(240),
  slug: z.preprocess(bosaNull, z.string().max(260).nullable()).optional(),
  stokKodu: z.preprocess(bosaNull, z.string().max(80).nullable()).optional(),
  kategoriId: sayiAlani,
  markaId: sayiAlani,
  kisaAciklama: z.preprocess(bosaNull, z.string().max(500).nullable()).optional(),
  aciklama: z.preprocess(bosaNull, z.string().max(8000).nullable()).optional(),
  fiyat: paraAlani,
  indirimliFiyat: paraAlani,
  fiyatGizli: z.boolean().default(false),
  taksitSayisi: sayiAlani,
  garantiSuresi: z.preprocess(bosaNull, z.string().max(80).nullable()).optional(),
  stokDurumu: z.enum(["stokta", "tukendi", "siparise_bagli"]).default("stokta"),
  oneCikan: z.boolean().default(false),
  yeniUrun: z.boolean().default(false),
  aktif: z.boolean().default(true),
  sira: z.preprocess((d) => (typeof d === "string" && d.trim() !== "" ? Number(d) : 0), z.number().int()),
  seoBaslik: z.preprocess(bosaNull, z.string().max(200).nullable()).optional(),
  seoAciklama: z.preprocess(bosaNull, z.string().max(500).nullable()).optional(),
  ozellikler: z
    .array(
      z.object({
        ad: z.string().trim().min(1).max(120),
        deger: z.string().trim().min(1).max(240),
      }),
    )
    .max(60)
    .default([]),
});

/** Aynı slug başka bir üründe varsa sonuna sayı ekleyerek benzersizleştirir. */
async function benzersizSlug(temel: string, haricId?: number): Promise<string> {
  const kok = slugOlustur(temel) || "urun";

  for (let ek = 0; ek < 50; ek++) {
    const aday = ek === 0 ? kok : `${kok}-${ek + 1}`;
    const kosul = haricId
      ? and(eq(urunler.slug, aday), ne(urunler.id, haricId))
      : eq(urunler.slug, aday);

    const mevcut = await db.select({ id: urunler.id }).from(urunler).where(kosul).limit(1);
    if (mevcut.length === 0) return aday;
  }

  return `${kok}-${Date.now().toString().slice(-6)}`;
}

/** Arama sütununu ürün adı, marka ve kategoriden yeniden üretir. */
async function aramaMetniUret(
  ad: string,
  kategoriId: number | null,
  markaId: number | null,
  kisaAciklama: string | null,
  stokKodu: string | null,
): Promise<string> {
  const parcalar: (string | null)[] = [ad, kisaAciklama, stokKodu];

  if (kategoriId) {
    const k = await db
      .select({ ad: kategoriler.ad })
      .from(kategoriler)
      .where(eq(kategoriler.id, kategoriId))
      .limit(1);
    if (k[0]) parcalar.push(k[0].ad);
  }

  if (markaId) {
    const m = await db
      .select({ ad: markalar.ad })
      .from(markalar)
      .where(eq(markalar.id, markaId))
      .limit(1);
    if (m[0]) parcalar.push(m[0].ad);
  }

  return sadelestir(parcalar.filter(Boolean).join(" "));
}

function onbellekTazele(slug?: string | null) {
  revalidatePath("/", "layout");
  revalidatePath("/urunler");
  revalidatePath("/kampanyalar");
  if (slug) revalidatePath(`/urun/${slug}`);
}

export async function urunKaydet(girdi: unknown): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const cozum = UrunSemasi.safeParse(girdi);
  if (!cozum.success) {
    const alanlar: Record<string, string> = {};
    for (const sorun of cozum.error.issues) {
      const alan = sorun.path[0];
      if (typeof alan === "string" && !alanlar[alan]) alanlar[alan] = sorun.message;
    }
    return { durum: "hata", mesaj: "Formda hatalı alanlar var.", alanlar };
  }

  const v = cozum.data;

  /* İndirimli fiyat asıl fiyattan yüksek olamaz — sitede eksi indirim görünür. */
  if (v.fiyat && v.indirimliFiyat && Number(v.indirimliFiyat) >= Number(v.fiyat)) {
    return {
      durum: "hata",
      mesaj: "İndirimli fiyat, normal fiyattan düşük olmalı.",
      alanlar: { indirimliFiyat: "İndirimli fiyat normal fiyattan düşük olmalı." },
    };
  }

  const slug = await benzersizSlug(v.slug ?? v.ad, v.id);
  const aramaMetni = await aramaMetniUret(
    v.ad,
    v.kategoriId ?? null,
    v.markaId ?? null,
    v.kisaAciklama ?? null,
    v.stokKodu ?? null,
  );

  const alanlar = {
    ad: v.ad,
    slug,
    stokKodu: v.stokKodu ?? null,
    kategoriId: v.kategoriId ?? null,
    markaId: v.markaId ?? null,
    kisaAciklama: v.kisaAciklama ?? null,
    aciklama: v.aciklama ?? null,
    fiyat: v.fiyat ?? null,
    indirimliFiyat: v.indirimliFiyat ?? null,
    fiyatGizli: v.fiyatGizli,
    taksitSayisi: v.taksitSayisi ?? null,
    garantiSuresi: v.garantiSuresi ?? null,
    stokDurumu: v.stokDurumu,
    oneCikan: v.oneCikan,
    yeniUrun: v.yeniUrun,
    aktif: v.aktif,
    sira: v.sira,
    seoBaslik: v.seoBaslik ?? null,
    seoAciklama: v.seoAciklama ?? null,
    aramaMetni,
    guncellemeTarihi: new Date(),
  };

  let urunId: number;

  if (v.id) {
    const eski = await db
      .select({ slug: urunler.slug })
      .from(urunler)
      .where(eq(urunler.id, v.id))
      .limit(1);

    if (eski.length === 0) return { durum: "hata", mesaj: "Ürün bulunamadı." };

    await db.update(urunler).set(alanlar).where(eq(urunler.id, v.id));
    urunId = v.id;

    /* Slug değiştiyse eski adresin önbelleğini de temizle. */
    if (eski[0].slug !== slug) revalidatePath(`/urun/${eski[0].slug}`);
  } else {
    const [yeni] = await db.insert(urunler).values(alanlar).returning({ id: urunler.id });
    urunId = yeni.id;
  }

  /*
   * Özellikler tamamen yeniden yazılıyor. Tek tek eşleştirmek yerine silip yazmak,
   * sıralama ve silme durumlarını da doğru ele aldığı için hem daha basit hem daha
   * güvenilir; satır sayısı en fazla birkaç düzine.
   */
  await db.delete(urunOzellikleri).where(eq(urunOzellikleri.urunId, urunId));
  if (v.ozellikler.length > 0) {
    await db.insert(urunOzellikleri).values(
      v.ozellikler.map((ozellik, sira) => ({
        urunId,
        ad: ozellik.ad,
        deger: ozellik.deger,
        sira,
      })),
    );
  }

  onbellekTazele(slug);
  return { durum: "basarili", mesaj: v.id ? "Ürün güncellendi." : "Ürün eklendi.", id: urunId };
}

export async function urunSil(id: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select({ slug: urunler.slug })
    .from(urunler)
    .where(eq(urunler.id, id))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Ürün bulunamadı." };

  /* Görseller veritabanından cascade ile gidiyor; depodaki dosyaları elle temizliyoruz. */
  const gorseller = await db
    .select({ depoKimligi: urunGorselleri.depoKimligi })
    .from(urunGorselleri)
    .where(eq(urunGorselleri.urunId, id));

  await db.delete(urunler).where(eq(urunler.id, id));
  await Promise.all(gorseller.map((g) => gorselSil(g.depoKimligi)));

  onbellekTazele(kayitlar[0].slug);
  revalidatePath("/admin/urunler");
  return { durum: "basarili", mesaj: "Ürün silindi." };
}

/** Listeden hızlı açma/kapama — form açmadan yayın durumunu değiştirmek için. */
export async function urunDurumDegistir(
  id: number,
  alan: "aktif" | "oneCikan",
  deger: boolean,
): Promise<EylemSonucu> {
  await eylemIcinOturum();

  await db
    .update(urunler)
    .set({ [alan]: deger, guncellemeTarihi: new Date() })
    .where(eq(urunler.id, id));

  onbellekTazele();
  revalidatePath("/admin/urunler");
  return { durum: "basarili" };
}

export async function urunGorseliYukle(urunId: number, veri: FormData): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const dosya = veri.get("dosya");
  if (!(dosya instanceof File)) return { durum: "hata", mesaj: "Dosya seçilmedi." };

  try {
    const yuklenen = await gorselYukle(dosya, "urunler");

    const [sonuc] = await db
      .select({ enBuyuk: max(urunGorselleri.sira) })
      .from(urunGorselleri)
      .where(eq(urunGorselleri.urunId, urunId));

    await db.insert(urunGorselleri).values({
      urunId,
      url: yuklenen.url,
      depoKimligi: yuklenen.kimlik,
      sira: (sonuc?.enBuyuk ?? -1) + 1,
    });

    revalidatePath(`/admin/urunler/${urunId}`);
    onbellekTazele();
    return { durum: "basarili", mesaj: "Görsel yüklendi." };
  } catch (hata) {
    return {
      durum: "hata",
      mesaj: hata instanceof Error ? hata.message : "Görsel yüklenemedi.",
    };
  }
}

export async function urunGorseliSil(gorselId: number): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select()
    .from(urunGorselleri)
    .where(eq(urunGorselleri.id, gorselId))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Görsel bulunamadı." };

  await db.delete(urunGorselleri).where(eq(urunGorselleri.id, gorselId));
  await gorselSil(kayitlar[0].depoKimligi);

  revalidatePath(`/admin/urunler/${kayitlar[0].urunId}`);
  onbellekTazele();
  return { durum: "basarili", mesaj: "Görsel silindi." };
}

/** Görseli listede bir sıra yukarı/aşağı taşır. İlk sıradaki kapak görselidir. */
export async function urunGorseliTasi(gorselId: number, yon: "yukari" | "asagi"): Promise<EylemSonucu> {
  await eylemIcinOturum();

  const kayitlar = await db
    .select()
    .from(urunGorselleri)
    .where(eq(urunGorselleri.id, gorselId))
    .limit(1);

  if (kayitlar.length === 0) return { durum: "hata", mesaj: "Görsel bulunamadı." };
  const gorsel = kayitlar[0];

  const kardesler = await db
    .select()
    .from(urunGorselleri)
    .where(eq(urunGorselleri.urunId, gorsel.urunId))
    .orderBy(urunGorselleri.sira, urunGorselleri.id);

  const indeks = kardesler.findIndex((k) => k.id === gorselId);
  const hedefIndeks = yon === "yukari" ? indeks - 1 : indeks + 1;
  if (hedefIndeks < 0 || hedefIndeks >= kardesler.length) return { durum: "basarili" };

  /* Sıra numaralarını baştan yazmak, eşit veya boşluklu değerlerde de doğru sonuç verir. */
  const yeniSira = [...kardesler];
  [yeniSira[indeks], yeniSira[hedefIndeks]] = [yeniSira[hedefIndeks], yeniSira[indeks]];

  for (const [sira, kayit] of yeniSira.entries()) {
    await db.update(urunGorselleri).set({ sira }).where(eq(urunGorselleri.id, kayit.id));
  }

  revalidatePath(`/admin/urunler/${gorsel.urunId}`);
  onbellekTazele();
  return { durum: "basarili" };
}

/** Toplu işlem: seçili ürünleri yayına al, yayından kaldır veya sil. */
export async function urunlerToplu(
  kimlikler: number[],
  islem: "yayinla" | "gizle" | "sil",
): Promise<EylemSonucu> {
  await eylemIcinOturum();

  if (kimlikler.length === 0) return { durum: "hata", mesaj: "Ürün seçilmedi." };

  if (islem === "sil") {
    for (const id of kimlikler) await urunSil(id);
    return { durum: "basarili", mesaj: `${kimlikler.length} ürün silindi.` };
  }

  await db
    .update(urunler)
    .set({ aktif: islem === "yayinla", guncellemeTarihi: new Date() })
    .where(sql`${urunler.id} in ${kimlikler}`);

  onbellekTazele();
  revalidatePath("/admin/urunler");
  return {
    durum: "basarili",
    mesaj: `${kimlikler.length} ürün ${islem === "yayinla" ? "yayına alındı" : "yayından kaldırıldı"}.`,
  };
}
