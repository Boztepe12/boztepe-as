import type { Metadata } from "next";
import { PackageSearch, Plus } from "lucide-react";

import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { PanelSayfalama } from "@/components/admin/panel-sayfalama";
import { UrunFiltreCubugu } from "@/components/admin/urun-filtre-cubugu";
import { UrunListesi, type ListeUrunu } from "@/components/admin/urun-listesi";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import {
  formSecenekleri,
  OZEL_FILTRELER,
  STOK_FILTRELERI,
  YAYIN_FILTRELERI,
  YONETICI_SIRALAMALARI,
  yoneticiUrunleri,
} from "@/lib/sorgular/admin";

export const metadata: Metadata = { title: "Ürünler" };

type Parametreler = Record<string, string | string[] | undefined>;

/** Listede olmayan değer (elle yazılmış, eski bağlantı) filtre sayılmaz. */
function gecerli<T extends string>(liste: readonly T[], deger: string): T | undefined {
  return (liste as readonly string[]).includes(deger) ? (deger as T) : undefined;
}

/** "24.999" ya da "24999,90" gibi yazımları sayıya çevirir; bozuksa yok sayar. */
function tutar(deger: string): number | undefined {
  if (!deger.trim()) return undefined;
  const sayi = Number(deger.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(sayi) && sayi >= 0 ? sayi : undefined;
}

/** Adres çubuğunda aynı ad iki kez geçebilir; ilk değeri esas alıyoruz. */
function tek(deger: string | string[] | undefined): string {
  if (Array.isArray(deger)) return deger[0] ?? "";
  return deger ?? "";
}

export default async function UrunlerSayfasi({
  searchParams,
}: {
  searchParams: Promise<Parametreler>;
}) {
  const parametreler = await searchParams;

  /* Eski tek "durum" kutusunun yer imleri yeni filtrelere çevrilir. */
  const eskiDurum = tek(parametreler.durum);
  const deger = {
    arama: tek(parametreler.arama),
    kategori: tek(parametreler.kategori),
    marka: tek(parametreler.marka),
    yayin: tek(parametreler.yayin) || (eskiDurum === "aktif" || eskiDurum === "pasif" ? eskiDurum : ""),
    stok: tek(parametreler.stok) || (eskiDurum === "tukendi" ? eskiDurum : ""),
    ozel: tek(parametreler.ozel) || (eskiDurum === "indirimli" ? eskiDurum : ""),
    min: tek(parametreler.min),
    max: tek(parametreler.max),
    sirala: tek(parametreler.sirala),
  };
  const sayfa = Number(tek(parametreler.sayfa)) || 1;

  const [sonuc, secenekler] = await Promise.all([
    yoneticiUrunleri({
      arama: deger.arama || undefined,
      kategoriId: Number(deger.kategori) || undefined,
      markaId: Number(deger.marka) || undefined,
      yayin: gecerli(YAYIN_FILTRELERI, deger.yayin),
      stok: gecerli(STOK_FILTRELERI, deger.stok),
      ozel: gecerli(OZEL_FILTRELER, deger.ozel),
      minFiyat: tutar(deger.min),
      maxFiyat: tutar(deger.max),
      siralama: gecerli(YONETICI_SIRALAMALARI, deger.sirala),
      sayfa,
    }),
    formSecenekleri(),
  ]);

  /* Sıralama filtre sayılmaz: boş listede "filtreleri temizle" önerisi yalnız gerçek filtrede. */
  const filtreVar = [deger.arama, deger.kategori, deger.marka, deger.yayin, deger.stok, deger.ozel, deger.min, deger.max].some(Boolean);

  return (
    <>
      <SayfaBasligi
        baslik="Ürünler"
        aciklama={
          sonuc.toplam > 0
            ? `${sonuc.toplam} üründen ${sonuc.urunler.length} tanesi listeleniyor.`
            : "Kataloğunuzdaki ürünleri buradan yönetirsiniz."
        }
        eylem={
          <ButonBaglanti href="/admin/urunler/yeni">
            <Plus className="size-4" />
            Yeni ürün
          </ButonBaglanti>
        }
      />

      <UrunFiltreCubugu
        key={JSON.stringify(deger)}
        deger={deger}
        secenekler={secenekler}
      />

      {sonuc.urunler.length === 0 ? (
        <BosDurum
          simge={<PackageSearch className="size-10" />}
          baslik={filtreVar ? "Bu filtreye uyan ürün yok" : "Henüz ürün eklenmemiş"}
          aciklama={
            filtreVar
              ? "Arama sözcüğünü kısaltmayı ya da filtreleri temizlemeyi deneyin."
              : "İlk ürününüzü ekleyin; eklediğiniz an sitede yayına girer."
          }
          eylem={
            filtreVar ? (
              <ButonBaglanti href="/admin/urunler" gorunum="ikincil">
                Filtreleri temizle
              </ButonBaglanti>
            ) : (
              <ButonBaglanti href="/admin/urunler/yeni">
                <Plus className="size-4" />
                Yeni ürün ekle
              </ButonBaglanti>
            )
          }
        />
      ) : (
        <>
          <UrunListesi urunler={sonuc.urunler as ListeUrunu[]} />
          <PanelSayfalama
            yol="/admin/urunler"
            sayfa={sonuc.sayfa}
            sayfaSayisi={sonuc.sayfaSayisi}
            sorgu={deger}
          />
        </>
      )}
    </>
  );
}
