import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { kategoriler, urunler } from "@/lib/db/schema";

export type KategoriDugumu = {
  id: number;
  ad: string;
  slug: string;
  aciklama: string | null;
  gorselUrl: string | null;
  anaSayfadaGoster: boolean;
  urunAdedi: number;
  altKategoriler: KategoriDugumu[];
};

/**
 * Menü ve filtreler için iki seviyeli kategori ağacını tek seferde kurar.
 *
 * Her seviye için ayrı sorgu atmak yerine tüm kategorileri ve ürün sayımlarını
 * çekip ağacı bellekte kuruyoruz; kategori sayısı yüzler mertebesinde kalacağı
 * için bu hem daha hızlı hem de veritabanına çok daha az yük bindiriyor.
 */
export async function kategoriAgaci(): Promise<KategoriDugumu[]> {
  const [hepsi, sayimlar] = await Promise.all([
    db
      .select({
        id: kategoriler.id,
        ad: kategoriler.ad,
        slug: kategoriler.slug,
        aciklama: kategoriler.aciklama,
        gorselUrl: kategoriler.gorselUrl,
        anaSayfadaGoster: kategoriler.anaSayfadaGoster,
        ustKategoriId: kategoriler.ustKategoriId,
      })
      .from(kategoriler)
      .where(eq(kategoriler.aktif, true))
      .orderBy(asc(kategoriler.sira), asc(kategoriler.ad)),

    db
      .select({
        kategoriId: urunler.kategoriId,
        adet: sql<number>`cast(count(*) as int)`,
      })
      .from(urunler)
      .where(eq(urunler.aktif, true))
      .groupBy(urunler.kategoriId),
  ]);

  const sayimHaritasi = new Map<number, number>();
  for (const s of sayimlar) {
    if (s.kategoriId !== null) sayimHaritasi.set(s.kategoriId, s.adet);
  }

  const dugumler = new Map<number, KategoriDugumu>();
  for (const k of hepsi) {
    dugumler.set(k.id, {
      id: k.id,
      ad: k.ad,
      slug: k.slug,
      aciklama: k.aciklama,
      gorselUrl: k.gorselUrl,
      anaSayfadaGoster: k.anaSayfadaGoster,
      urunAdedi: sayimHaritasi.get(k.id) ?? 0,
      altKategoriler: [],
    });
  }

  const kokler: KategoriDugumu[] = [];
  for (const k of hepsi) {
    const dugum = dugumler.get(k.id)!;
    if (k.ustKategoriId && dugumler.has(k.ustKategoriId)) {
      dugumler.get(k.ustKategoriId)!.altKategoriler.push(dugum);
    } else {
      kokler.push(dugum);
    }
  }

  /* Ana kategorinin ürün adedi, alt kategorilerinin toplamını da içermeli. */
  for (const kok of kokler) {
    kok.urunAdedi += kok.altKategoriler.reduce((toplam, alt) => toplam + alt.urunAdedi, 0);
  }

  return kokler;
}

export async function anaKategoriler() {
  return db
    .select({
      id: kategoriler.id,
      ad: kategoriler.ad,
      slug: kategoriler.slug,
      aciklama: kategoriler.aciklama,
      gorselUrl: kategoriler.gorselUrl,
    })
    .from(kategoriler)
    .where(and(eq(kategoriler.aktif, true), isNull(kategoriler.ustKategoriId)))
    .orderBy(asc(kategoriler.sira), asc(kategoriler.ad));
}

export async function kategoriGetir(slug: string) {
  const kayitlar = await db
    .select()
    .from(kategoriler)
    .where(and(eq(kategoriler.slug, slug), eq(kategoriler.aktif, true)))
    .limit(1);

  if (kayitlar.length === 0) return null;
  const kategori = kayitlar[0];

  const altlar = await db
    .select({
      id: kategoriler.id,
      ad: kategoriler.ad,
      slug: kategoriler.slug,
    })
    .from(kategoriler)
    .where(and(eq(kategoriler.ustKategoriId, kategori.id), eq(kategoriler.aktif, true)))
    .orderBy(asc(kategoriler.sira), asc(kategoriler.ad));

  let ustKategori: { ad: string; slug: string } | null = null;
  if (kategori.ustKategoriId) {
    const ust = await db
      .select({ ad: kategoriler.ad, slug: kategoriler.slug })
      .from(kategoriler)
      .where(eq(kategoriler.id, kategori.ustKategoriId))
      .limit(1);
    ustKategori = ust[0] ?? null;
  }

  return { ...kategori, altKategoriler: altlar, ustKategori };
}

/** Sitemap ve statik üretim için tüm kategori sluglari. */
export async function tumKategoriSluglari() {
  return db
    .select({ slug: kategoriler.slug, guncelleme: kategoriler.guncellemeTarihi })
    .from(kategoriler)
    .where(eq(kategoriler.aktif, true));
}
