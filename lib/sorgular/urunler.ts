import { and, asc, desc, eq, gte, inArray, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  kategoriler,
  markalar,
  urunGorselleri,
  urunOzellikleri,
  urunler,
} from "@/lib/db/schema";
import { sadelestir } from "@/lib/utils";

export type Siralama = "onerilen" | "yeni" | "fiyat-artan" | "fiyat-azalan" | "populer";

export type UrunFiltresi = {
  kategoriSlug?: string;
  markaSluglari?: string[];
  arama?: string;
  minFiyat?: number;
  maxFiyat?: number;
  sadeceIndirimli?: boolean;
  sadeceStokta?: boolean;
  siralama?: Siralama;
  sayfa?: number;
  sayfaBoyutu?: number;
};

/**
 * Listelerde gösterilecek fiyat, indirimli fiyat varsa odur. Sıralama ve fiyat
 * aralığı filtresi bu birleşik değer üzerinden çalışmalı ki indirime giren ürün
 * kullanıcının seçtiği aralıkta doğru yerde çıksın.
 */
const gecerliFiyat = sql<number>`coalesce(${urunler.indirimliFiyat}, ${urunler.fiyat})`;

export type ListelenenUrun = {
  id: number;
  ad: string;
  slug: string;
  kisaAciklama: string | null;
  fiyat: string | null;
  indirimliFiyat: string | null;
  fiyatGizli: boolean;
  taksitSayisi: number | null;
  stokDurumu: "stokta" | "tukendi" | "siparise_bagli";
  oneCikan: boolean;
  yeniUrun: boolean;
  markaAdi: string | null;
  kategoriAdi: string | null;
  kategoriSlug: string | null;
  gorselUrl: string | null;
};

/** Kartlarda tek görsel yeter; her ürünün en düşük sıralı görselini alt sorguyla çekiyoruz. */
const kapakGorseli = sql<string | null>`(
  select ${urunGorselleri.url}
  from ${urunGorselleri}
  where ${urunGorselleri.urunId} = ${urunler.id}
  order by ${urunGorselleri.sira} asc, ${urunGorselleri.id} asc
  limit 1
)`;

async function kategoriVeAltlari(slug: string): Promise<number[]> {
  const kategori = await db
    .select({ id: kategoriler.id })
    .from(kategoriler)
    .where(eq(kategoriler.slug, slug))
    .limit(1);

  if (kategori.length === 0) return [];

  const altlar = await db
    .select({ id: kategoriler.id })
    .from(kategoriler)
    .where(eq(kategoriler.ustKategoriId, kategori[0].id));

  return [kategori[0].id, ...altlar.map((k) => k.id)];
}

function siralamaIfadesi(siralama: Siralama = "onerilen"): SQL[] {
  switch (siralama) {
    case "yeni":
      return [desc(urunler.olusturmaTarihi), desc(urunler.id)];
    case "fiyat-artan":
      return [asc(gecerliFiyat), asc(urunler.id)];
    case "fiyat-azalan":
      return [desc(gecerliFiyat), asc(urunler.id)];
    case "populer":
      return [desc(urunler.goruntulenme), asc(urunler.sira)];
    default:
      /* Önerilen: önce öne çıkanlar, sonra yöneticinin belirlediği el sırası. */
      return [desc(urunler.oneCikan), asc(urunler.sira), desc(urunler.id)];
  }
}

export async function urunleriListele(filtre: UrunFiltresi = {}) {
  const sayfa = Math.max(1, filtre.sayfa ?? 1);
  const sayfaBoyutu = Math.min(60, Math.max(1, filtre.sayfaBoyutu ?? 12));

  const kosullar: SQL[] = [eq(urunler.aktif, true)];

  if (filtre.kategoriSlug) {
    const kimlikler = await kategoriVeAltlari(filtre.kategoriSlug);
    /* Kategori bulunamadıysa boş sonuç dönsün; tüm ürünleri göstermek yanıltıcı olur. */
    if (kimlikler.length === 0) {
      return { urunler: [] as ListelenenUrun[], toplam: 0, sayfa, sayfaBoyutu, sayfaSayisi: 0 };
    }
    kosullar.push(inArray(urunler.kategoriId, kimlikler));
  }

  if (filtre.markaSluglari?.length) {
    const markaKimlikleri = await db
      .select({ id: markalar.id })
      .from(markalar)
      .where(inArray(markalar.slug, filtre.markaSluglari));

    if (markaKimlikleri.length === 0) {
      return { urunler: [] as ListelenenUrun[], toplam: 0, sayfa, sayfaBoyutu, sayfaSayisi: 0 };
    }
    kosullar.push(
      inArray(
        urunler.markaId,
        markaKimlikleri.map((m) => m.id),
      ),
    );
  }

  if (filtre.arama?.trim()) {
    /*
     * Arama metni kaydedilirken sadeleştirildiği için sorguyu da aynı biçime
     * sokuyoruz; böylece "ÇAMAŞIR" araması "camasir makinesi" kaydını bulur.
     * Kelimeler ayrı ayrı aranır ki "vestel buzdolabı" sırası önemli olmasın.
     */
    const kelimeler = sadelestir(filtre.arama).split(/\s+/).filter(Boolean).slice(0, 6);
    for (const kelime of kelimeler) {
      kosullar.push(sql`${urunler.aramaMetni} like ${`%${kelime}%`}`);
    }
  }

  if (filtre.minFiyat !== undefined) kosullar.push(gte(gecerliFiyat, String(filtre.minFiyat)));
  if (filtre.maxFiyat !== undefined) kosullar.push(lte(gecerliFiyat, String(filtre.maxFiyat)));
  if (filtre.sadeceIndirimli) kosullar.push(isNotNull(urunler.indirimliFiyat));
  if (filtre.sadeceStokta) kosullar.push(eq(urunler.stokDurumu, "stokta"));

  const kosul = and(...kosullar);

  const [{ adet }] = await db
    .select({ adet: sql<number>`cast(count(*) as int)` })
    .from(urunler)
    .where(kosul);

  const kayitlar = await db
    .select({
      id: urunler.id,
      ad: urunler.ad,
      slug: urunler.slug,
      kisaAciklama: urunler.kisaAciklama,
      fiyat: urunler.fiyat,
      indirimliFiyat: urunler.indirimliFiyat,
      fiyatGizli: urunler.fiyatGizli,
      taksitSayisi: urunler.taksitSayisi,
      stokDurumu: urunler.stokDurumu,
      oneCikan: urunler.oneCikan,
      yeniUrun: urunler.yeniUrun,
      markaAdi: markalar.ad,
      kategoriAdi: kategoriler.ad,
      kategoriSlug: kategoriler.slug,
      gorselUrl: kapakGorseli,
    })
    .from(urunler)
    .leftJoin(markalar, eq(urunler.markaId, markalar.id))
    .leftJoin(kategoriler, eq(urunler.kategoriId, kategoriler.id))
    .where(kosul)
    .orderBy(...siralamaIfadesi(filtre.siralama))
    .limit(sayfaBoyutu)
    .offset((sayfa - 1) * sayfaBoyutu);

  return {
    urunler: kayitlar as ListelenenUrun[],
    toplam: adet,
    sayfa,
    sayfaBoyutu,
    sayfaSayisi: Math.ceil(adet / sayfaBoyutu),
  };
}

export async function urunGetir(slug: string) {
  const kayitlar = await db
    .select({
      urun: urunler,
      markaAdi: markalar.ad,
      markaSlug: markalar.slug,
      kategoriAdi: kategoriler.ad,
      kategoriSlug: kategoriler.slug,
      ustKategoriId: kategoriler.ustKategoriId,
    })
    .from(urunler)
    .leftJoin(markalar, eq(urunler.markaId, markalar.id))
    .leftJoin(kategoriler, eq(urunler.kategoriId, kategoriler.id))
    .where(and(eq(urunler.slug, slug), eq(urunler.aktif, true)))
    .limit(1);

  if (kayitlar.length === 0) return null;
  const kayit = kayitlar[0];

  const [gorseller, ozellikler] = await Promise.all([
    db
      .select()
      .from(urunGorselleri)
      .where(eq(urunGorselleri.urunId, kayit.urun.id))
      .orderBy(asc(urunGorselleri.sira), asc(urunGorselleri.id)),
    db
      .select()
      .from(urunOzellikleri)
      .where(eq(urunOzellikleri.urunId, kayit.urun.id))
      .orderBy(asc(urunOzellikleri.sira), asc(urunOzellikleri.id)),
  ]);

  /* Üst kategori, ekmek kırıntısı yolunu tamamlamak için ayrıca çekiliyor. */
  let ustKategori: { ad: string; slug: string } | null = null;
  if (kayit.ustKategoriId) {
    const ust = await db
      .select({ ad: kategoriler.ad, slug: kategoriler.slug })
      .from(kategoriler)
      .where(eq(kategoriler.id, kayit.ustKategoriId))
      .limit(1);
    ustKategori = ust[0] ?? null;
  }

  return { ...kayit, gorseller, ozellikler, ustKategori };
}

/** Ürün detayında gösterilen benzer ürünler: aynı kategoriden, kendisi hariç. */
export async function benzerUrunler(urunId: number, kategoriId: number | null, adet = 4) {
  if (!kategoriId) return [];

  const kayitlar = await db
    .select({
      id: urunler.id,
      ad: urunler.ad,
      slug: urunler.slug,
      kisaAciklama: urunler.kisaAciklama,
      fiyat: urunler.fiyat,
      indirimliFiyat: urunler.indirimliFiyat,
      fiyatGizli: urunler.fiyatGizli,
      taksitSayisi: urunler.taksitSayisi,
      stokDurumu: urunler.stokDurumu,
      oneCikan: urunler.oneCikan,
      yeniUrun: urunler.yeniUrun,
      markaAdi: markalar.ad,
      kategoriAdi: kategoriler.ad,
      kategoriSlug: kategoriler.slug,
      gorselUrl: kapakGorseli,
    })
    .from(urunler)
    .leftJoin(markalar, eq(urunler.markaId, markalar.id))
    .leftJoin(kategoriler, eq(urunler.kategoriId, kategoriler.id))
    .where(
      and(
        eq(urunler.aktif, true),
        eq(urunler.kategoriId, kategoriId),
        sql`${urunler.id} <> ${urunId}`,
      ),
    )
    .orderBy(desc(urunler.oneCikan), asc(urunler.sira))
    .limit(adet);

  return kayitlar as ListelenenUrun[];
}

/** Ana sayfa şeritleri için kısa listeler. */
export async function oneCikanUrunler(adet = 8) {
  const { urunler: liste } = await urunleriListele({ siralama: "onerilen", sayfaBoyutu: adet });
  return liste.filter((u) => u.oneCikan).slice(0, adet);
}

export async function indirimliUrunler(adet = 8) {
  const { urunler: liste } = await urunleriListele({
    sadeceIndirimli: true,
    siralama: "onerilen",
    sayfaBoyutu: adet,
  });
  return liste;
}

export async function yeniUrunler(adet = 8) {
  const { urunler: liste } = await urunleriListele({ siralama: "yeni", sayfaBoyutu: adet });
  return liste;
}

/** Filtre panelindeki fiyat kaydırıcısının sınırları. */
export async function fiyatAraligi(kategoriSlug?: string) {
  const kosullar: SQL[] = [eq(urunler.aktif, true), isNotNull(urunler.fiyat)];

  if (kategoriSlug) {
    const kimlikler = await kategoriVeAltlari(kategoriSlug);
    if (kimlikler.length === 0) return { enDusuk: 0, enYuksek: 0 };
    kosullar.push(inArray(urunler.kategoriId, kimlikler));
  }

  const [sonuc] = await db
    .select({
      enDusuk: sql<number>`cast(coalesce(min(${gecerliFiyat}), 0) as int)`,
      enYuksek: sql<number>`cast(coalesce(max(${gecerliFiyat}), 0) as int)`,
    })
    .from(urunler)
    .where(and(...kosullar));

  return sonuc ?? { enDusuk: 0, enYuksek: 0 };
}

/** Bir kategoride hangi markaların kaç ürünü var — filtre panelinde sayılarla gösterilir. */
export async function kategorininMarkalari(kategoriSlug?: string) {
  const kosullar: SQL[] = [eq(urunler.aktif, true), isNotNull(urunler.markaId)];

  if (kategoriSlug) {
    const kimlikler = await kategoriVeAltlari(kategoriSlug);
    if (kimlikler.length === 0) return [];
    kosullar.push(inArray(urunler.kategoriId, kimlikler));
  }

  return db
    .select({
      ad: markalar.ad,
      slug: markalar.slug,
      adet: sql<number>`cast(count(*) as int)`,
    })
    .from(urunler)
    .innerJoin(markalar, eq(urunler.markaId, markalar.id))
    .where(and(...kosullar))
    .groupBy(markalar.ad, markalar.slug)
    .orderBy(asc(markalar.ad));
}

/** Ürün detay görüntülenmesini sayar. Sayaç kritik değil, hata sayfayı düşürmemeli. */
export async function goruntulenmeArtir(urunId: number) {
  try {
    await db
      .update(urunler)
      .set({ goruntulenme: sql`${urunler.goruntulenme} + 1` })
      .where(eq(urunler.id, urunId));
  } catch {
    /* Yoksay: sayaç hatası ürün sayfasını engellememeli. */
  }
}

/** Üst menüdeki hızlı arama için hafif sonuç listesi. */
export async function hizliArama(terim: string, adet = 6) {
  if (!terim.trim()) return [];

  const kelimeler = sadelestir(terim).split(/\s+/).filter(Boolean).slice(0, 4);
  if (kelimeler.length === 0) return [];

  const kosullar: SQL[] = [eq(urunler.aktif, true)];
  for (const kelime of kelimeler) {
    kosullar.push(sql`${urunler.aramaMetni} like ${`%${kelime}%`}`);
  }

  const kayitlar = await db
    .select({
      ad: urunler.ad,
      slug: urunler.slug,
      fiyat: urunler.fiyat,
      indirimliFiyat: urunler.indirimliFiyat,
      fiyatGizli: urunler.fiyatGizli,
      gorselUrl: kapakGorseli,
      kategoriAdi: kategoriler.ad,
    })
    .from(urunler)
    .leftJoin(kategoriler, eq(urunler.kategoriId, kategoriler.id))
    .where(and(...kosullar))
    .orderBy(desc(urunler.oneCikan), asc(urunler.sira))
    .limit(adet);

  return kayitlar;
}

/** Teklif sepetindeki ürünleri tek sorguda getirir. */
export async function sepetUrunleri(kimlikler: number[]) {
  if (kimlikler.length === 0) return [];

  const kayitlar = await db
    .select({
      id: urunler.id,
      ad: urunler.ad,
      slug: urunler.slug,
      fiyat: urunler.fiyat,
      indirimliFiyat: urunler.indirimliFiyat,
      fiyatGizli: urunler.fiyatGizli,
      stokDurumu: urunler.stokDurumu,
      markaAdi: markalar.ad,
      gorselUrl: kapakGorseli,
    })
    .from(urunler)
    .leftJoin(markalar, eq(urunler.markaId, markalar.id))
    .where(and(eq(urunler.aktif, true), inArray(urunler.id, kimlikler)));

  return kayitlar;
}

export { or };
