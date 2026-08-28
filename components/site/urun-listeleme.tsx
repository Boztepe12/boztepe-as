import { Suspense } from "react";
import { PackageSearch } from "lucide-react";

import { Sayfalama } from "@/components/site/sayfalama";
import { SiralamaSecici, UrunFiltreleri } from "@/components/site/urun-filtreleri";
import { UrunIzgarasi, UrunKarti } from "@/components/site/urun-karti";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import {
  fiyatAraligi,
  kategorininMarkalari,
  urunleriListele,
  type Siralama,
} from "@/lib/sorgular/urunler";

export type AramaParametreleri = Record<string, string | string[] | undefined>;

/** URL parametrelerini sorgu filtresine çevirir; bozuk değerler sessizce yok sayılır. */
function filtreCoz(parametreler: AramaParametreleri) {
  const tek = (anahtar: string) => {
    const deger = parametreler[anahtar];
    return Array.isArray(deger) ? deger[0] : deger;
  };

  const sayi = (anahtar: string) => {
    const ham = tek(anahtar);
    if (!ham) return undefined;
    const deger = Number(ham);
    return Number.isFinite(deger) && deger >= 0 ? deger : undefined;
  };

  const gecerliSiralamalar: Siralama[] = [
    "onerilen",
    "yeni",
    "fiyat-artan",
    "fiyat-azalan",
    "populer",
  ];
  const siralaHam = tek("sirala") as Siralama | undefined;

  return {
    arama: tek("arama")?.slice(0, 80),
    markaSluglari: (tek("marka") ?? "").split(",").filter(Boolean),
    minFiyat: sayi("min"),
    maxFiyat: sayi("max"),
    sadeceIndirimli: tek("indirimli") === "1",
    sadeceStokta: tek("stokta") === "1",
    siralama: siralaHam && gecerliSiralamalar.includes(siralaHam) ? siralaHam : undefined,
    sayfa: sayi("sayfa") ?? 1,
  };
}

export async function UrunListeleme({
  baslik,
  aciklama,
  kategoriSlug,
  markaSlug,
  parametreler,
  ekmekKirintisi,
}: {
  baslik: string;
  aciklama?: string | null;
  kategoriSlug?: string;
  markaSlug?: string;
  parametreler: AramaParametreleri;
  ekmekKirintisi?: React.ReactNode;
}) {
  const filtre = filtreCoz(parametreler);

  /*
   * Marka sayfasındayken filtre panelindeki marka seçimi anlamsız olur; o sayfada
   * markayı sabitleyip listeden çıkarıyoruz.
   */
  const markaFiltresi = markaSlug ? [markaSlug] : filtre.markaSluglari;

  const [sonuc, markalar, fiyatSiniri] = await Promise.all([
    urunleriListele({
      kategoriSlug,
      markaSluglari: markaFiltresi,
      arama: filtre.arama,
      minFiyat: filtre.minFiyat,
      maxFiyat: filtre.maxFiyat,
      sadeceIndirimli: filtre.sadeceIndirimli,
      sadeceStokta: filtre.sadeceStokta,
      siralama: filtre.siralama,
      sayfa: filtre.sayfa,
      sayfaBoyutu: 12,
    }),
    markaSlug ? Promise.resolve([]) : kategorininMarkalari(kategoriSlug),
    fiyatAraligi(kategoriSlug),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      {ekmekKirintisi}

      <header className="mb-8">
        <h1 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">{baslik}</h1>
        {aciklama && <p className="mt-3 max-w-2xl leading-relaxed text-murekkep-yumusak">{aciklama}</p>}
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        <Suspense fallback={<div className="h-10" />}>
          <UrunFiltreleri markalar={markalar} fiyatSiniri={fiyatSiniri} toplam={sonuc.toplam} />
        </Suspense>

        <div className="min-w-0">
          <div className="mb-6 hidden items-center justify-between lg:flex">
            <p className="text-sm text-murekkep-yumusak">
              <span className="rakam font-medium text-murekkep">{sonuc.toplam}</span> ürün bulundu
              {filtre.arama && (
                <>
                  {" "}
                  — <span className="text-murekkep">&ldquo;{filtre.arama}&rdquo;</span> için
                </>
              )}
            </p>
            <Suspense fallback={null}>
              <SiralamaSecici />
            </Suspense>
          </div>

          <p className="mb-4 text-sm text-murekkep-yumusak lg:hidden">
            <span className="rakam font-medium text-murekkep">{sonuc.toplam}</span> ürün
          </p>

          {sonuc.urunler.length === 0 ? (
            <BosDurum
              simge={<PackageSearch className="size-10" />}
              baslik="Aradığınız kriterlere uygun ürün bulunamadı"
              aciklama="Filtreleri gevşetmeyi ya da farklı bir arama terimi denemeyi önerebiliriz. Aradığınız ürün mağazamızda olabilir — WhatsApp'tan sorabilirsiniz."
              eylem={
                <ButonBaglanti href="/urunler" gorunum="ikincil">
                  Tüm ürünlere dön
                </ButonBaglanti>
              }
            />
          ) : (
            <>
              <UrunIzgarasi>
                {sonuc.urunler.map((urun, i) => (
                  <UrunKarti key={urun.id} urun={urun} oncelikli={i < 4} />
                ))}
              </UrunIzgarasi>

              <Suspense fallback={null}>
                <Sayfalama sayfa={sonuc.sayfa} sayfaSayisi={sonuc.sayfaSayisi} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
