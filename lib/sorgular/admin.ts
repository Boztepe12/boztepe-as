import { and, asc, desc, eq, ilike, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  afisler,
  bankaHesaplari,
  galeriGorselleri,
  kategoriler,
  markalar,
  talepKalemleri,
  talepler,
  urunGorselleri,
  urunOzellikleri,
  urunler,
  yoneticiler,
} from "@/lib/db/schema";
import { sadelestir } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Özet ekranı                                                         */
/* ------------------------------------------------------------------ */

export async function panelOzeti() {
  const [urunSayilari, talepSayilari, sonTalepler, digerSayilar] = await Promise.all([
    db
      .select({
        toplam: sql<number>`cast(count(*) as int)`,
        aktif: sql<number>`cast(count(*) filter (where ${urunler.aktif}) as int)`,
        indirimli: sql<number>`cast(count(*) filter (where ${urunler.indirimliFiyat} is not null) as int)`,
        tukenen: sql<number>`cast(count(*) filter (where ${urunler.stokDurumu} = 'tukendi') as int)`,
        fiyatsiz: sql<number>`cast(count(*) filter (where ${urunler.fiyat} is null and not ${urunler.fiyatGizli}) as int)`,
        gorselsiz: sql<number>`cast(count(*) filter (where not exists (
          select 1 from ${urunGorselleri} where ${urunGorselleri.urunId} = ${urunler.id}
        )) as int)`,
      })
      .from(urunler),

    db
      .select({
        toplam: sql<number>`cast(count(*) as int)`,
        yeni: sql<number>`cast(count(*) filter (where ${talepler.durum} = 'yeni') as int)`,
        acik: sql<number>`cast(count(*) filter (where ${talepler.durum} in ('yeni','arandi','teklif_verildi')) as int)`,
        kazanilan: sql<number>`cast(count(*) filter (where ${talepler.durum} = 'satisa_donustu') as int)`,
      })
      .from(talepler),

    db
      .select({
        id: talepler.id,
        kod: talepler.kod,
        adSoyad: talepler.adSoyad,
        telefon: talepler.telefon,
        durum: talepler.durum,
        toplamTutar: talepler.toplamTutar,
        olusturmaTarihi: talepler.olusturmaTarihi,
        kalemAdedi: sql<number>`cast((
          select count(*) from ${talepKalemleri}
          where ${talepKalemleri.talepId} = ${talepler.id}
        ) as int)`,
      })
      .from(talepler)
      .orderBy(desc(talepler.olusturmaTarihi))
      .limit(6),

    db
      .select({
        kategori: sql<number>`cast((select count(*) from ${kategoriler}) as int)`,
        marka: sql<number>`cast((select count(*) from ${markalar}) as int)`,
        afis: sql<number>`cast((select count(*) from ${afisler} where ${afisler.aktif}) as int)`,
        galeri: sql<number>`cast((select count(*) from ${galeriGorselleri}) as int)`,
      })
      .from(sql`(select 1) as tek`),
  ]);

  return {
    urun: urunSayilari[0],
    talep: talepSayilari[0],
    sonTalepler,
    diger: digerSayilar[0],
  };
}

/** Ana sayfada öne çıkan ama görseli olmayan ürünler gibi, düzeltilmesi gereken noktalar. */
export async function dikkatGerektirenler() {
  const gorselsiz = await db
    .select({ id: urunler.id, ad: urunler.ad })
    .from(urunler)
    .where(
      and(
        eq(urunler.aktif, true),
        sql`not exists (select 1 from ${urunGorselleri} where ${urunGorselleri.urunId} = ${urunler.id})`,
      ),
    )
    .limit(5);

  const fiyatsiz = await db
    .select({ id: urunler.id, ad: urunler.ad })
    .from(urunler)
    .where(and(eq(urunler.aktif, true), eq(urunler.fiyatGizli, false), sql`${urunler.fiyat} is null`))
    .limit(5);

  return { gorselsiz, fiyatsiz };
}

/* ------------------------------------------------------------------ */
/* Ürün yönetimi                                                       */
/* ------------------------------------------------------------------ */

export type YoneticiUrunFiltresi = {
  arama?: string;
  kategoriId?: number;
  markaId?: number;
  durum?: "hepsi" | "aktif" | "pasif" | "indirimli" | "tukendi";
  sayfa?: number;
};

export async function yoneticiUrunleri(filtre: YoneticiUrunFiltresi = {}) {
  const sayfa = Math.max(1, filtre.sayfa ?? 1);
  const sayfaBoyutu = 25;
  const kosullar: SQL[] = [];

  if (filtre.arama?.trim()) {
    const terim = `%${sadelestir(filtre.arama)}%`;
    /* Stok kodu sadeleştirilmiş metinde yer almayabilir; ayrıca arıyoruz. */
    const kosul = or(
      sql`${urunler.aramaMetni} like ${terim}`,
      ilike(urunler.stokKodu, `%${filtre.arama.trim()}%`),
    );
    if (kosul) kosullar.push(kosul);
  }

  if (filtre.kategoriId) kosullar.push(eq(urunler.kategoriId, filtre.kategoriId));
  if (filtre.markaId) kosullar.push(eq(urunler.markaId, filtre.markaId));

  switch (filtre.durum) {
    case "aktif":
      kosullar.push(eq(urunler.aktif, true));
      break;
    case "pasif":
      kosullar.push(eq(urunler.aktif, false));
      break;
    case "indirimli":
      kosullar.push(isNotNull(urunler.indirimliFiyat));
      break;
    case "tukendi":
      kosullar.push(eq(urunler.stokDurumu, "tukendi"));
      break;
  }

  const kosul = kosullar.length > 0 ? and(...kosullar) : undefined;

  const [{ adet }] = await db
    .select({ adet: sql<number>`cast(count(*) as int)` })
    .from(urunler)
    .where(kosul);

  const kayitlar = await db
    .select({
      id: urunler.id,
      ad: urunler.ad,
      slug: urunler.slug,
      stokKodu: urunler.stokKodu,
      fiyat: urunler.fiyat,
      indirimliFiyat: urunler.indirimliFiyat,
      fiyatGizli: urunler.fiyatGizli,
      stokDurumu: urunler.stokDurumu,
      aktif: urunler.aktif,
      oneCikan: urunler.oneCikan,
      guncellemeTarihi: urunler.guncellemeTarihi,
      kategoriAdi: kategoriler.ad,
      markaAdi: markalar.ad,
      gorselUrl: sql<string | null>`(
        select ${urunGorselleri.url} from ${urunGorselleri}
        where ${urunGorselleri.urunId} = ${urunler.id}
        order by ${urunGorselleri.sira} asc limit 1
      )`,
    })
    .from(urunler)
    .leftJoin(kategoriler, eq(urunler.kategoriId, kategoriler.id))
    .leftJoin(markalar, eq(urunler.markaId, markalar.id))
    .where(kosul)
    .orderBy(desc(urunler.guncellemeTarihi))
    .limit(sayfaBoyutu)
    .offset((sayfa - 1) * sayfaBoyutu);

  return { urunler: kayitlar, toplam: adet, sayfa, sayfaSayisi: Math.ceil(adet / sayfaBoyutu) };
}

export async function yoneticiUrunGetir(id: number) {
  const kayitlar = await db.select().from(urunler).where(eq(urunler.id, id)).limit(1);
  if (kayitlar.length === 0) return null;

  const [gorseller, ozellikler] = await Promise.all([
    db
      .select()
      .from(urunGorselleri)
      .where(eq(urunGorselleri.urunId, id))
      .orderBy(asc(urunGorselleri.sira), asc(urunGorselleri.id)),
    db
      .select()
      .from(urunOzellikleri)
      .where(eq(urunOzellikleri.urunId, id))
      .orderBy(asc(urunOzellikleri.sira), asc(urunOzellikleri.id)),
  ]);

  return { urun: kayitlar[0], gorseller, ozellikler };
}

/** Ürün formundaki kategori ve marka açılır listeleri. */
export async function formSecenekleri() {
  const [kategoriListesi, markaListesi] = await Promise.all([
    db
      .select({
        id: kategoriler.id,
        ad: kategoriler.ad,
        ustKategoriId: kategoriler.ustKategoriId,
      })
      .from(kategoriler)
      .orderBy(asc(kategoriler.sira), asc(kategoriler.ad)),
    db
      .select({ id: markalar.id, ad: markalar.ad })
      .from(markalar)
      .orderBy(asc(markalar.sira), asc(markalar.ad)),
  ]);

  /* Alt kategorileri üstlerinin altında göstermek için etiketleri hazırlıyoruz. */
  const ustAdlari = new Map(
    kategoriListesi.filter((k) => !k.ustKategoriId).map((k) => [k.id, k.ad]),
  );

  const kategoriSecenekleri = kategoriListesi.map((k) => ({
    id: k.id,
    etiket: k.ustKategoriId
      ? `${ustAdlari.get(k.ustKategoriId) ?? "?"} › ${k.ad}`
      : k.ad,
    altMi: Boolean(k.ustKategoriId),
  }));

  return { kategoriler: kategoriSecenekleri, markalar: markaListesi };
}

/* ------------------------------------------------------------------ */
/* Talep yönetimi                                                      */
/* ------------------------------------------------------------------ */

export async function yoneticiTalepleri(durum?: string, sayfa = 1) {
  const sayfaBoyutu = 25;
  const gecerliDurumlar = ["yeni", "arandi", "teklif_verildi", "satisa_donustu", "iptal"] as const;
  const kosul =
    durum && (gecerliDurumlar as readonly string[]).includes(durum)
      ? eq(talepler.durum, durum as (typeof gecerliDurumlar)[number])
      : undefined;

  const [{ adet }] = await db
    .select({ adet: sql<number>`cast(count(*) as int)` })
    .from(talepler)
    .where(kosul);

  const kayitlar = await db
    .select({
      id: talepler.id,
      kod: talepler.kod,
      adSoyad: talepler.adSoyad,
      telefon: talepler.telefon,
      eposta: talepler.eposta,
      durum: talepler.durum,
      toplamTutar: talepler.toplamTutar,
      olusturmaTarihi: talepler.olusturmaTarihi,
      kalemAdedi: sql<number>`cast((
        select count(*) from ${talepKalemleri}
        where ${talepKalemleri.talepId} = ${talepler.id}
      ) as int)`,
    })
    .from(talepler)
    .where(kosul)
    .orderBy(desc(talepler.olusturmaTarihi))
    .limit(sayfaBoyutu)
    .offset((sayfa - 1) * sayfaBoyutu);

  const sayimlar = await db
    .select({ durum: talepler.durum, adet: sql<number>`cast(count(*) as int)` })
    .from(talepler)
    .groupBy(talepler.durum);

  return {
    talepler: kayitlar,
    toplam: adet,
    sayfa,
    sayfaSayisi: Math.ceil(adet / sayfaBoyutu),
    sayimlar: Object.fromEntries(sayimlar.map((s) => [s.durum, s.adet])),
  };
}

export async function talepGetir(id: number) {
  const kayitlar = await db.select().from(talepler).where(eq(talepler.id, id)).limit(1);
  if (kayitlar.length === 0) return null;

  const kalemler = await db
    .select()
    .from(talepKalemleri)
    .where(eq(talepKalemleri.talepId, id))
    .orderBy(asc(talepKalemleri.id));

  return { talep: kayitlar[0], kalemler };
}

export async function bekleyenTalepSayisi(): Promise<number> {
  try {
    const [sonuc] = await db
      .select({ adet: sql<number>`cast(count(*) as int)` })
      .from(talepler)
      .where(eq(talepler.durum, "yeni"));
    return sonuc?.adet ?? 0;
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------------------ */
/* Diğer listeler                                                      */
/* ------------------------------------------------------------------ */

export async function tumKategoriler() {
  const kayitlar = await db
    .select({
      id: kategoriler.id,
      ad: kategoriler.ad,
      slug: kategoriler.slug,
      ustKategoriId: kategoriler.ustKategoriId,
      sira: kategoriler.sira,
      aktif: kategoriler.aktif,
      anaSayfadaGoster: kategoriler.anaSayfadaGoster,
      gorselUrl: kategoriler.gorselUrl,
      urunAdedi: sql<number>`cast((
        select count(*) from ${urunler} where ${urunler.kategoriId} = ${kategoriler.id}
      ) as int)`,
    })
    .from(kategoriler)
    .orderBy(asc(kategoriler.sira), asc(kategoriler.ad));

  return kayitlar;
}

export async function tumMarkalar() {
  return db
    .select({
      id: markalar.id,
      ad: markalar.ad,
      slug: markalar.slug,
      logoUrl: markalar.logoUrl,
      aciklama: markalar.aciklama,
      sira: markalar.sira,
      aktif: markalar.aktif,
      urunAdedi: sql<number>`cast((
        select count(*) from ${urunler} where ${urunler.markaId} = ${markalar.id}
      ) as int)`,
    })
    .from(markalar)
    .orderBy(asc(markalar.sira), asc(markalar.ad));
}

export async function tumAfisler() {
  return db.select().from(afisler).orderBy(asc(afisler.sira), asc(afisler.id));
}

export async function tumGaleri() {
  return db
    .select()
    .from(galeriGorselleri)
    .orderBy(asc(galeriGorselleri.sira), asc(galeriGorselleri.id));
}

export async function tumBankaHesaplari() {
  return db.select().from(bankaHesaplari).orderBy(asc(bankaHesaplari.sira), asc(bankaHesaplari.id));
}

export async function tumYoneticiler() {
  return db
    .select({
      id: yoneticiler.id,
      eposta: yoneticiler.eposta,
      adSoyad: yoneticiler.adSoyad,
      rol: yoneticiler.rol,
      aktif: yoneticiler.aktif,
      sonGirisTarihi: yoneticiler.sonGirisTarihi,
    })
    .from(yoneticiler)
    .orderBy(asc(yoneticiler.id));
}

export { inArray };

/* ------------------------------------------------------------------ */
/* Kategori ve marka tekil kayitlari                                   */
/* ------------------------------------------------------------------ */

export async function yoneticiKategoriGetir(id: number) {
  const kayitlar = await db.select().from(kategoriler).where(eq(kategoriler.id, id)).limit(1);
  return kayitlar[0] ?? null;
}

export async function yoneticiMarkaGetir(id: number) {
  const kayitlar = await db.select().from(markalar).where(eq(markalar.id, id)).limit(1);
  return kayitlar[0] ?? null;
}
