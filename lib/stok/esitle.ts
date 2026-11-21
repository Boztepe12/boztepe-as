import "server-only";

import { revalidatePath } from "next/cache";
import { eq, isNotNull, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { kategoriler, stokEntegrasyonu, urunGorselleri, urunler } from "@/lib/db/schema";
import { sadelestir, slugOlustur } from "@/lib/utils";
import { kategoriListesi, StokApiHatasi, urunGetir, urunSayfasi, type StokKategori, type StokUrunu } from "./istemci";

/**
 * Stok Yönetimi → site eşitlemesi.
 *
 * Bir ürün barkoduyla (urunler.stok_barkod) eşlenir. Bulunamazsa, sitede elle
 * açılmış ve stok kodu bu barkod olan bir ürün varsa ona bağlanır; o da yoksa
 * yeni ürün açılır — ayar kapalıyken gizli (yönetici "Stok bağlantısı"
 * ekranından seçip yayınlar). Stok sistemi yalnızca şunları yazar: stok
 * miktarı, liste fiyatı, ürün bazında açıksa fiyat ve stok durumu, ve
 * kategori. Vitrin alanları (ad, açıklama, fotoğraf, yayın) yöneticinindir;
 * yeni ürün açılırken bir kez doldurulur, sonra dokunulmaz.
 *
 * Kategoriler (2026-11-22): sitenin kategori ağacı stok sisteminden gelir
 * (`/categories`, stokta siteden gizlenmemiş kategoriler). Her eşitleme önce
 * ağacı yazar: ad, üst kategori ve sıra oradan; görsel, açıklama, ana sayfa ve
 * SEO sitenin. Elle açılmış kategoriler silinir (ürünleri kategorisiz kalır);
 * stoktan gelip listeden çıkan kategori pasife alınır, geri gelince açılır. Stoktan gelen ürünün kategorisi her eşitlemede
 * stoktakine çekilir; ürünü başka kategoriye taşımak stok sisteminde yapılır.
 *
 * Neon'un HTTP sürücüsü işlem (transaction) desteklemediği için her ürün kendi
 * başına yazılır; aynı ürünü iki kez eşitlemek sonucu değiştirmez.
 */

export type KategoriSonucu = { eklenen: number; guncellenen: number; silinen: number };
export type EsitlemeSonucu = {
  eklenen: number;
  guncellenen: number;
  kaldirilan: number;
  hatalar: string[];
  kategoriler?: KategoriSonucu;
};

const DURUM_ID = 1;

export async function durumOku() {
  const r = await db.select().from(stokEntegrasyonu).where(eq(stokEntegrasyonu.id, DURUM_ID)).limit(1);
  if (r[0]) return r[0];
  const yeni = await db.insert(stokEntegrasyonu).values({ id: DURUM_ID }).onConflictDoNothing().returning();
  return yeni[0] ?? (await db.select().from(stokEntegrasyonu).where(eq(stokEntegrasyonu.id, DURUM_ID)).limit(1))[0];
}

/** Stok fiyatı metni ("24999.90") → numeric için metin; geçersizse null. */
function para(v: string | undefined | null): string | null {
  return v && /^\d+(\.\d{1,2})?$/.test(v) ? v : null;
}

async function benzersizSlug(temel: string): Promise<string> {
  const kok = slugOlustur(temel) || "urun";
  for (let ek = 0; ek < 50; ek++) {
    const aday = ek === 0 ? kok : `${kok}-${ek + 1}`;
    const var_ = await db.select({ id: urunler.id }).from(urunler).where(eq(urunler.slug, aday)).limit(1);
    if (var_.length === 0) return aday;
  }
  return `${kok}-${Date.now().toString().slice(-6)}`;
}

async function benzersizKategoriSlug(temel: string, haric?: number): Promise<string> {
  const kok = slugOlustur(temel) || "kategori";
  for (let ek = 0; ek < 50; ek++) {
    const aday = ek === 0 ? kok : `${kok}-${ek + 1}`;
    const var_ = await db.select({ id: kategoriler.id }).from(kategoriler).where(eq(kategoriler.slug, aday)).limit(1);
    if (var_.length === 0 || var_[0].id === haric) return aday;
  }
  return `${kok}-${Date.now().toString().slice(-6)}`;
}

/** Stok kategori kimliği → sitedeki kategori kimliği. */
export async function kategoriHaritasi(): Promise<Map<string, number>> {
  const r = await db.select({ id: kategoriler.id, stokId: kategoriler.stokKategoriId }).from(kategoriler)
    .where(isNotNull(kategoriler.stokKategoriId));
  return new Map(r.map((k) => [k.stokId!, k.id]));
}

/**
 * Sitenin kategori ağacını stok sistemindekiyle değiştirir. Liste ağaç
 * sırasında geldiği için üst kategori her zaman altından önce yazılır; sıra
 * (`sira`) listedeki yeridir. Görsel, açıklama, ana sayfa ve SEO korunur.
 */
export async function kategorileriYaz(liste: StokKategori[]): Promise<KategoriSonucu> {
  const sonuc: KategoriSonucu = { eklenen: 0, guncellenen: 0, silinen: 0 };
  const mevcut = await db.select().from(kategoriler);
  const stoktan = new Map(mevcut.filter((k) => k.stokKategoriId).map((k) => [k.stokKategoriId!, k]));
  const yerel = new Map<string, number>();
  const simdi = new Date();

  // Önce listede olmayanlar, ki yeni kategoriler adreslerini (slug) alabilsin:
  // elle açılmış kategori silinir (ürünlerinin bağı veritabanında "set null");
  // stoktan gelmiş ama artık listede olmayan (stokta siteden gizlenmiş ya da
  // silinmiş) kategori pasife alınır — görseli, açıklaması ve adresi kalır,
  // geri gelirse aynı kayıt açılır.
  const gelen = new Set(liste.map((k) => k.id));
  for (const k of mevcut) {
    if (!k.stokKategoriId) {
      await db.delete(kategoriler).where(eq(kategoriler.id, k.id));
      sonuc.silinen++;
    } else if (!gelen.has(k.stokKategoriId) && k.aktif) {
      await db.update(kategoriler).set({ aktif: false, guncellemeTarihi: simdi }).where(eq(kategoriler.id, k.id));
      sonuc.silinen++;
    }
  }

  for (const [sira, k] of liste.entries()) {
    const ust = k.parentId ? (yerel.get(k.parentId) ?? null) : null;
    const ad = k.name.slice(0, 160);
    const eski = stoktan.get(k.id);
    if (eski) {
      if (eski.ad !== ad || eski.ustKategoriId !== ust || eski.sira !== sira || !eski.aktif) {
        await db.update(kategoriler).set({ ad, ustKategoriId: ust, sira, aktif: true, guncellemeTarihi: simdi })
          .where(eq(kategoriler.id, eski.id));
        sonuc.guncellenen++;
      }
      yerel.set(k.id, eski.id);
    } else {
      const [yeni] = await db.insert(kategoriler).values({
        ad, slug: await benzersizKategoriSlug(ad), ustKategoriId: ust, sira, aktif: true, stokKategoriId: k.id,
      }).returning({ id: kategoriler.id });
      yerel.set(k.id, yeni.id);
      sonuc.eklenen++;
    }
  }

  return sonuc;
}

/** Kategori ağacını stok sisteminden okuyup yazar. */
export async function kategorileriEsitle(): Promise<KategoriSonucu> {
  return kategorileriYaz(await kategoriListesi());
}

/** "Beyaz Eşya > Buzdolapları" → sitedeki adı en derin parçayla eşleşen kategori (eski API, categoryId yoksa). */
async function kategoriBul(yol: string | null | undefined): Promise<number | null> {
  if (!yol) return null;
  const parcalar = yol.split(/\s*[>›]\s*/).map((p) => sadelestir(p)).filter(Boolean).reverse();
  if (parcalar.length === 0) return null;
  const tum = await db.select({ id: kategoriler.id, ad: kategoriler.ad }).from(kategoriler);
  for (const p of parcalar) {
    const k = tum.find((x) => sadelestir(x.ad) === p);
    if (k) return k.id;
  }
  return null;
}

/** Bir stok ürününü siteye yazar. "eklendi" | "guncellendi" | "kaldirildi" | null (değişiklik yok). */
export async function urunUygula(
  u: StokUrunu,
  yeniUrunleriYayinla: boolean,
  harita?: Map<string, number>,
): Promise<"eklendi" | "guncellendi" | "kaldirildi" | null> {
  const simdi = new Date();
  // categoryId gelmişse (2026-11-22 ve sonrası) kategori stoktakidir; yoksa eski yol: adla eşle, yalnız yeni üründe.
  const stokKategorisi = async (): Promise<number | null> => {
    if (!u.categoryId) return null;
    return (harita ?? (await kategoriHaritasi())).get(u.categoryId) ?? null;
  };
  const mevcut = (
    await db.select().from(urunler)
      .where(or(eq(urunler.stokBarkod, u.barcode), eq(urunler.stokUrunId, u.id)))
      .limit(1)
  )[0];

  if (u.removed) {
    if (!mevcut || mevcut.stokKaldirildi) return null;
    await db.update(urunler)
      .set({ stokKaldirildi: true, stokOncekiAktif: mevcut.aktif, aktif: false, stokEsitlemeTarihi: simdi, guncellemeTarihi: simdi })
      .where(eq(urunler.id, mevcut.id));
    return "kaldirildi";
  }

  const liste = para(u.listPrice);
  const miktar = u.stock ?? "0";
  const stokta = Number(miktar) > 0;

  const hedef =
    mevcut ??
    (await db.select().from(urunler)
      .where(eq(urunler.stokKodu, u.barcode))
      .limit(1)
      .then((r) => (r[0] && !r[0].stokBarkod ? r[0] : undefined)));

  if (hedef) {
    await db.update(urunler).set({
      stokBarkod: u.barcode,
      stokUrunId: u.id,
      stokMiktari: miktar,
      stokListeFiyati: liste,
      stokKaldirildi: false,
      // Kaldırılmıştı ve geri geldi (ör. kategorisi yeniden sitede): önceki yayın durumuna dön.
      ...(hedef.stokKaldirildi ? { aktif: hedef.stokOncekiAktif ?? false, stokOncekiAktif: null } : {}),
      stokEsitlemeTarihi: simdi,
      ...(u.categoryId !== undefined ? { kategoriId: await stokKategorisi() } : {}),
      ...(hedef.fiyatStoktan && liste ? { fiyat: liste } : {}),
      ...(hedef.stokDurumuStoktan && hedef.stokDurumu !== "siparise_bagli"
        ? { stokDurumu: stokta ? ("stokta" as const) : ("tukendi" as const) }
        : {}),
      guncellemeTarihi: simdi,
    }).where(eq(urunler.id, hedef.id));
    return "guncellendi";
  }

  const ad = (u.name ?? u.barcode).slice(0, 240);
  const kategoriId = u.categoryId !== undefined ? await stokKategorisi() : await kategoriBul(u.category);
  const eklenen = await db.insert(urunler).values({
    ad,
    slug: await benzersizSlug(ad),
    stokKodu: u.barcode,
    kategoriId,
    aciklama: u.description ?? null,
    fiyat: liste,
    stokDurumu: stokta ? "stokta" : "tukendi",
    aktif: yeniUrunleriYayinla,
    yeniUrun: true,
    aramaMetni: sadelestir([ad, u.barcode, u.category ?? ""].join(" ")),
    stokBarkod: u.barcode,
    stokUrunId: u.id,
    stokMiktari: miktar,
    stokListeFiyati: liste,
    stokEsitlemeTarihi: simdi,
  }).returning({ id: urunler.id });
  if (u.imageUrl && eklenen[0]) {
    await db.insert(urunGorselleri).values({ urunId: eklenen[0].id, url: u.imageUrl, altMetin: ad.slice(0, 240), sira: 0 });
  }
  return "eklendi";
}

function vitriniTazele() {
  revalidatePath("/", "layout");
  revalidatePath("/urunler");
  revalidatePath("/admin/stok");
  revalidatePath("/admin/urunler");
}

/**
 * Değişenleri çeker (tam = true: hepsini baştan). İmleç, ilk sayfanın sunucu
 * saatine ilerler; bir hata olursa ilerlemez, sonraki eşitleme aynı yerden
 * tekrar dener.
 */
export async function esitle({ tam = false }: { tam?: boolean } = {}): Promise<EsitlemeSonucu> {
  const durum = await durumOku();
  const since = tam ? null : durum.sonImlec;
  const sonuc: EsitlemeSonucu = { eklenen: 0, guncellenen: 0, kaldirilan: 0, hatalar: [] };
  let imlec: string | null = null;
  try {
    // Stok sistemi kategori ucunu henüz sunmuyorsa (eski sürüm: 404) kategori adımı atlanır;
    // ürünler eskisi gibi eşitlenir (kategori adla eşlenir, yalnız yeni üründe).
    try {
      sonuc.kategoriler = await kategorileriEsitle();
    } catch (e) {
      if (!(e instanceof StokApiHatasi && e.durum === 404)) throw e;
    }
    const harita = await kategoriHaritasi();
    let offset: number | null = 0;
    while (offset !== null) {
      const sayfa = await urunSayfasi(since, offset);
      imlec ??= sayfa.serverTime;
      for (const u of sayfa.data) {
        try {
          const r = await urunUygula(u, durum.yeniUrunleriYayinla, harita);
          if (r === "eklendi") sonuc.eklenen++;
          else if (r === "guncellendi") sonuc.guncellenen++;
          else if (r === "kaldirildi") sonuc.kaldirilan++;
        } catch (e) {
          sonuc.hatalar.push(`${u.barcode}: ${(e as Error).message}`.slice(0, 300));
        }
      }
      offset = sayfa.nextOffset;
    }
  } catch (e) {
    const mesaj = e instanceof StokApiHatasi ? e.message : `Beklenmeyen hata: ${(e as Error).message}`;
    await db.update(stokEntegrasyonu)
      .set({ sonHata: mesaj, sonHataTarihi: new Date(), sonSonuc: sonuc, guncellemeTarihi: new Date() })
      .where(eq(stokEntegrasyonu.id, DURUM_ID));
    vitriniTazele();
    throw e;
  }
  await db.update(stokEntegrasyonu).set({
    sonImlec: sonuc.hatalar.length ? durum.sonImlec : imlec,
    sonEsitleme: new Date(),
    sonSonuc: sonuc,
    sonHata: sonuc.hatalar.length ? `${sonuc.hatalar.length} ürün yazılamadı` : null,
    sonHataTarihi: sonuc.hatalar.length ? new Date() : null,
    guncellemeTarihi: new Date(),
  }).where(eq(stokEntegrasyonu.id, DURUM_ID));
  vitriniTazele();
  return sonuc;
}

/** Webhook: tek ürünü stok sisteminden okuyup uygular. */
export async function barkodEsitle(barkod: string) {
  const durum = await durumOku();
  const u = await urunGetir(barkod);
  if (u) return urunUygula(u, durum.yeniUrunleriYayinla);
  // Yayından kalkmış: bağlı ürünü gizle.
  const bagli = (await db.select({ id: urunler.id, stokUrunId: urunler.stokUrunId }).from(urunler)
    .where(eq(urunler.stokBarkod, barkod)).limit(1))[0];
  if (!bagli) return null;
  return urunUygula({ id: bagli.stokUrunId ?? "", barcode: barkod, removed: true }, durum.yeniUrunleriYayinla);
}

