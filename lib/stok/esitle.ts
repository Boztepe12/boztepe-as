import "server-only";

import { revalidatePath } from "next/cache";
import { eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { kategoriler, stokEntegrasyonu, urunGorselleri, urunler } from "@/lib/db/schema";
import { sadelestir, slugOlustur } from "@/lib/utils";
import { StokApiHatasi, urunGetir, urunSayfasi, type StokUrunu } from "./istemci";

/**
 * Stok Yönetimi → site eşitlemesi.
 *
 * Bir ürün barkoduyla (urunler.stok_barkod) eşlenir. Bulunamazsa, sitede elle
 * açılmış ve stok kodu bu barkod olan bir ürün varsa ona bağlanır; o da yoksa
 * yeni ürün açılır — ayar kapalıyken gizli (yönetici "Stok bağlantısı"
 * ekranından seçip yayınlar). Stok sistemi yalnızca şunları yazar: stok
 * miktarı, liste fiyatı, ürün bazında açıksa fiyat ve stok durumu. Vitrin
 * alanları (ad, açıklama, fotoğraf, kategori, yayın) yöneticinindir; yeni ürün
 * açılırken bir kez doldurulur, sonra dokunulmaz.
 *
 * Neon'un HTTP sürücüsü işlem (transaction) desteklemediği için her ürün kendi
 * başına yazılır; aynı ürünü iki kez eşitlemek sonucu değiştirmez.
 */

export type EsitlemeSonucu = { eklenen: number; guncellenen: number; kaldirilan: number; hatalar: string[] };

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

/** "Beyaz Eşya > Buzdolapları" → sitedeki adı en derin parçayla eşleşen kategori. */
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
export async function urunUygula(u: StokUrunu, yeniUrunleriYayinla: boolean): Promise<"eklendi" | "guncellendi" | "kaldirildi" | null> {
  const simdi = new Date();
  const mevcut = (
    await db.select().from(urunler)
      .where(or(eq(urunler.stokBarkod, u.barcode), eq(urunler.stokUrunId, u.id)))
      .limit(1)
  )[0];

  if (u.removed) {
    if (!mevcut || mevcut.stokKaldirildi) return null;
    await db.update(urunler)
      .set({ stokKaldirildi: true, aktif: false, stokEsitlemeTarihi: simdi, guncellemeTarihi: simdi })
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
      stokEsitlemeTarihi: simdi,
      ...(hedef.fiyatStoktan && liste ? { fiyat: liste } : {}),
      ...(hedef.stokDurumuStoktan && hedef.stokDurumu !== "siparise_bagli"
        ? { stokDurumu: stokta ? ("stokta" as const) : ("tukendi" as const) }
        : {}),
      guncellemeTarihi: simdi,
    }).where(eq(urunler.id, hedef.id));
    return "guncellendi";
  }

  const ad = (u.name ?? u.barcode).slice(0, 240);
  const kategoriId = await kategoriBul(u.category);
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
    let offset: number | null = 0;
    while (offset !== null) {
      const sayfa = await urunSayfasi(since, offset);
      imlec ??= sayfa.serverTime;
      for (const u of sayfa.data) {
        try {
          const r = await urunUygula(u, durum.yeniUrunleriYayinla);
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

