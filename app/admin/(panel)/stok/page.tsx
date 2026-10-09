import type { Metadata } from "next";
import { and, asc, count, desc, eq, isNotNull } from "drizzle-orm";

import { Panel, SayfaBasligi } from "@/components/admin/panel-parcalari";
import { StokDenetimi, StokUrunListesi } from "@/components/admin/stok-entegrasyonu";
import { db } from "@/lib/db";
import { urunler } from "@/lib/db/schema";
import { durumOku } from "@/lib/stok/esitle";
import { stokBaglantisiVar } from "@/lib/stok/istemci";
import { tarihSaatBicimle } from "@/lib/utils";

export const metadata: Metadata = { title: "Stok Bağlantısı" };

export default async function StokSayfasi({ searchParams }: { searchParams: Promise<{ gorunum?: string }> }) {
  const gorunum = (await searchParams).gorunum === "yayinda" ? "yayinda" : "bekleyen";
  const [durum, sayilar, liste] = await Promise.all([
    durumOku(),
    db.select({ aktif: urunler.aktif, kaldirildi: urunler.stokKaldirildi, adet: count() })
      .from(urunler).where(isNotNull(urunler.stokBarkod)).groupBy(urunler.aktif, urunler.stokKaldirildi),
    db.select({
      id: urunler.id, ad: urunler.ad, slug: urunler.slug, stokBarkod: urunler.stokBarkod, stokMiktari: urunler.stokMiktari,
      fiyat: urunler.fiyat, stokListeFiyati: urunler.stokListeFiyati, fiyatStoktan: urunler.fiyatStoktan, aktif: urunler.aktif,
    }).from(urunler)
      .where(and(isNotNull(urunler.stokBarkod), eq(urunler.stokKaldirildi, false), eq(urunler.aktif, gorunum === "yayinda")))
      .orderBy(gorunum === "yayinda" ? asc(urunler.ad) : desc(urunler.olusturmaTarihi))
      .limit(500),
  ]);
  const say = (aktif: boolean | null, kaldirildi = false) =>
    sayilar.filter((s) => (aktif === null || s.aktif === aktif) && s.kaldirildi === kaldirildi).reduce((t, s) => t + s.adet, 0);
  const sonuc = durum.sonSonuc as { eklenen?: number; guncellenen?: number; kaldirilan?: number } | null;

  return (
    <>
      <SayfaBasligi
        baslik="Stok bağlantısı"
        aciklama="Ürünler, fiyatlar ve stok Boztepe'nin stok sisteminden gelir. Hangi ürünün sitede görüneceğini ve nasıl sergileneceğini siz seçersiniz."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel baslik={gorunum === "yayinda" ? `Sitede yayında (${say(true)})` : `Yayın bekleyen (${say(false)})`}
            aciklama={gorunum === "yayinda"
              ? "Stok sisteminden gelen ve sitede görünen ürünler."
              : "Stok sisteminden gelen ama sitede henüz görünmeyen ürünler. Seçip yayınlayın; fotoğraf ve açıklama eklemek için ürünü açın."}>
            <StokUrunListesi gorunum={gorunum} urunler={liste.map((u) => ({ ...u, stokBarkod: u.stokBarkod ?? "" }))} />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel baslik="Eşitleme">
            <div className="space-y-3 p-5 text-sm">
              {!stokBaglantisiVar() && (
                <p className="rounded-md bg-uyari/10 p-3 text-uyari">
                  Bağlantı ayarlanmamış. Sunucuda STOK_API_URL ve STOK_API_KEY tanımlanmalı (Stok Yönetimi paneli → Web sitesi entegrasyonu → API anahtarı).
                </p>
              )}
              <dl className="space-y-1.5">
                <div className="flex justify-between gap-3"><dt className="text-murekkep-yumusak">Son eşitleme</dt><dd>{durum.sonEsitleme ? tarihSaatBicimle(durum.sonEsitleme) : "hiç"}</dd></div>
                {sonuc && <div className="flex justify-between gap-3"><dt className="text-murekkep-yumusak">Son sonuç</dt>
                  <dd>{sonuc.eklenen ?? 0} yeni · {sonuc.guncellenen ?? 0} güncel · {sonuc.kaldirilan ?? 0} kaldırıldı</dd></div>}
                <div className="flex justify-between gap-3"><dt className="text-murekkep-yumusak">Bağlı ürün</dt><dd>{say(null)}</dd></div>
                {say(null, true) > 0 && <div className="flex justify-between gap-3"><dt className="text-murekkep-yumusak">Stokta kaldırılmış</dt><dd>{say(null, true)}</dd></div>}
              </dl>
              {durum.sonHata && (
                <p className="rounded-md bg-hata/10 p-3 text-hata">
                  {durum.sonHata}{durum.sonHataTarihi && ` (${tarihSaatBicimle(durum.sonHataTarihi)})`}
                </p>
              )}
              <StokDenetimi yeniUrunleriYayinla={durum.yeniUrunleriYayinla} />
              <p className="text-xs text-solgun">
                Fiyat veya stok değişince stok sistemi siteye anında haber verir (webhook); ayrıca her gece bir kez tam kontrol yapılır.
                Bir ürünün fiyatını elle yönetmek için ürünü açıp &quot;Fiyat stok sisteminden gelsin&quot; işaretini kaldırın.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
