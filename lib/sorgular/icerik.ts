import { and, asc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  afisler,
  ayarlar,
  bankaHesaplari,
  galeriGorselleri,
  markalar,
  urunler,
} from "@/lib/db/schema";

/* ------------------------------------------------------------------ */
/* Site ayarları                                                       */
/* ------------------------------------------------------------------ */

export type IletisimAyari = {
  firmaAdi: string;
  kisaAd: string;
  telefon: string;
  whatsapp: string;
  eposta: string;
  adres: string;
  haritaBaglantisi: string;
  calismaSaatleri: { gun: string; saat: string }[];
};

export type HakkimizdaAyari = {
  baslik: string;
  kurulusYili: number;
  ozet: string;
  paragraflar: string[];
  degerler: { baslik: string; metin: string }[];
};

export type DuyuruAyari = { aktif: boolean; metin: string; baglanti: string };
export type SosyalAyari = { facebook: string; instagram: string };
export type SeoAyari = { baslik: string; aciklama: string };

/*
 * Ayarlar tablosu boş ya da eksik olabilir (henüz tohumlanmamış bir veritabanı,
 * yeni eklenen bir anahtar). Sayfaların bu yüzden çökmemesi için her ayarın
 * makul bir varsayılanı burada duruyor.
 */
type AyarKumesi = {
  iletisim: IletisimAyari;
  hakkimizda: HakkimizdaAyari;
  duyuru: DuyuruAyari;
  sosyal: SosyalAyari;
  seo: SeoAyari;
};

/*
 * Tipi açıkça bildiriyoruz: `satisfies` ile bırakıldığında boş diziler `never[]`
 * olarak çıkarılıyor ve `degerler.map(...)` çağrıları derlenmiyor.
 */
const VARSAYILANLAR: AyarKumesi = {
  iletisim: {
    firmaAdi: "Boztepe Ev Gereçleri İnşaat San. Tic. A.Ş.",
    kisaAd: "Boztepe A.Ş.",
    telefon: "0422 321 20 36",
    whatsapp: "0507 464 12 74",
    eposta: "boztepehalep@hotmail.com",
    adres: "Malatya",
    haritaBaglantisi: "",
    calismaSaatleri: [{ gun: "Pazartesi - Cumartesi", saat: "09:00 - 19:00" }],
  },
  hakkimizda: {
    baslik: "1963'ten beri evinizin yanında",
    kurulusYili: 1963,
    ozet: "",
    paragraflar: [],
    degerler: [],
  },
  duyuru: { aktif: false, metin: "", baglanti: "" },
  sosyal: { facebook: "", instagram: "" },
  seo: {
    baslik: "Boztepe A.Ş. — Malatya Beyaz Eşya, Mobilya ve Halı Mağazası",
    aciklama: "1963'ten beri Malatya'da beyaz eşya, mobilya ve halı.",
  },
};

type AyarAnahtari = keyof typeof VARSAYILANLAR;

export async function ayarGetir<A extends AyarAnahtari>(
  anahtar: A,
): Promise<(typeof VARSAYILANLAR)[A]> {
  try {
    const kayitlar = await db
      .select({ deger: ayarlar.deger })
      .from(ayarlar)
      .where(eq(ayarlar.anahtar, anahtar))
      .limit(1);

    if (kayitlar.length === 0) return VARSAYILANLAR[anahtar];

    /* Kayıtlı değer eksik alan içerebilir; varsayılanın üstüne yazıyoruz. */
    return { ...VARSAYILANLAR[anahtar], ...(kayitlar[0].deger as object) } as (typeof VARSAYILANLAR)[A];
  } catch {
    return VARSAYILANLAR[anahtar];
  }
}

export async function tumAyarlar() {
  const kayitlar = await db.select().from(ayarlar);
  const harita = new Map(kayitlar.map((k) => [k.anahtar, k.deger]));

  return Object.fromEntries(
    (Object.keys(VARSAYILANLAR) as AyarAnahtari[]).map((anahtar) => [
      anahtar,
      { ...VARSAYILANLAR[anahtar], ...((harita.get(anahtar) as object) ?? {}) },
    ]),
  ) as typeof VARSAYILANLAR;
}

export async function ayarKaydet(anahtar: string, deger: unknown) {
  await db
    .insert(ayarlar)
    .values({ anahtar, deger, guncellemeTarihi: new Date() })
    .onConflictDoUpdate({
      target: ayarlar.anahtar,
      set: { deger, guncellemeTarihi: new Date() },
    });
}

/* ------------------------------------------------------------------ */
/* Afişler                                                             */
/* ------------------------------------------------------------------ */

/** Yayın tarihi aralığı içindeki aktif afişler. Tarih boşsa süresiz kabul edilir. */
export async function yayindakiAfisler() {
  const simdi = new Date();

  return db
    .select()
    .from(afisler)
    .where(
      and(
        eq(afisler.aktif, true),
        or(isNull(afisler.baslangicTarihi), lte(afisler.baslangicTarihi, simdi)),
        or(isNull(afisler.bitisTarihi), gte(afisler.bitisTarihi, simdi)),
      ),
    )
    .orderBy(asc(afisler.sira), asc(afisler.id));
}

/* ------------------------------------------------------------------ */
/* Markalar                                                            */
/* ------------------------------------------------------------------ */

export async function aktifMarkalar() {
  return db
    .select({
      id: markalar.id,
      ad: markalar.ad,
      slug: markalar.slug,
      logoUrl: markalar.logoUrl,
      aciklama: markalar.aciklama,
      urunAdedi: sql<number>`cast((
        select count(*) from ${urunler}
        where ${urunler.markaId} = ${markalar.id} and ${urunler.aktif} = true
      ) as int)`,
    })
    .from(markalar)
    .where(eq(markalar.aktif, true))
    .orderBy(asc(markalar.sira), asc(markalar.ad));
}

export async function markaGetir(slug: string) {
  const kayitlar = await db
    .select()
    .from(markalar)
    .where(and(eq(markalar.slug, slug), eq(markalar.aktif, true)))
    .limit(1);

  return kayitlar[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Galeri ve banka hesapları                                           */
/* ------------------------------------------------------------------ */

export async function galeri() {
  return db
    .select()
    .from(galeriGorselleri)
    .where(eq(galeriGorselleri.aktif, true))
    .orderBy(asc(galeriGorselleri.sira), asc(galeriGorselleri.id));
}

export async function aktifBankaHesaplari() {
  return db
    .select()
    .from(bankaHesaplari)
    .where(eq(bankaHesaplari.aktif, true))
    .orderBy(asc(bankaHesaplari.sira), asc(bankaHesaplari.id));
}
