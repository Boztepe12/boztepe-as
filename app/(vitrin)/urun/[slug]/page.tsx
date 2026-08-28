import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CreditCard, Package, Truck } from "lucide-react";

import { SepeteEkleButonu } from "@/components/sepet/sepete-ekle-butonu";
import { EkmekKirintisi, type KirintiAdimi } from "@/components/site/ekmek-kirintisi";
import { WhatsappSimgesi } from "@/components/site/marka-simgeleri";
import { UrunGalerisi } from "@/components/site/urun-galerisi";
import { UrunIzgarasi, UrunKarti } from "@/components/site/urun-karti";
import { DisBaglanti } from "@/components/ui/buton";
import { BolumBasligi } from "@/components/ui/durum";
import { Rozet, StokRozeti } from "@/components/ui/rozet";
import { ayarGetir } from "@/lib/sorgular/icerik";
import {
  benzerUrunler,
  goruntulenmeArtir,
  urunGetir,
} from "@/lib/sorgular/urunler";
import { fiyatBicimle, indirimYuzdesi, taksitMetni, whatsappBaglantisi } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kayit = await urunGetir(slug);
  if (!kayit) return { title: "Ürün bulunamadı" };

  const { urun, gorseller } = kayit;

  return {
    title: urun.seoBaslik ?? urun.ad,
    description: urun.seoAciklama ?? urun.kisaAciklama ?? undefined,
    alternates: { canonical: `/urun/${urun.slug}` },
    openGraph: {
      title: urun.ad,
      description: urun.kisaAciklama ?? undefined,
      images: gorseller[0]?.url ? [{ url: gorseller[0].url }] : undefined,
      type: "website",
    },
  };
}

export default async function UrunSayfasi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kayit = await urunGetir(slug);

  if (!kayit) notFound();

  const { urun, gorseller, ozellikler, markaAdi, markaSlug, kategoriAdi, kategoriSlug, ustKategori } =
    kayit;

  const [benzerler, iletisim] = await Promise.all([
    benzerUrunler(urun.id, urun.kategoriId),
    ayarGetir("iletisim"),
  ]);

  /* Sayaç sayfayı bekletmemeli; sonucu beklemeden ilerliyoruz. */
  void goruntulenmeArtir(urun.id);

  const indirim = indirimYuzdesi(urun.fiyat, urun.indirimliFiyat);
  const gecerliFiyat = urun.indirimliFiyat ?? urun.fiyat;
  const taksit = urun.taksitSayisi && gecerliFiyat ? taksitMetni(gecerliFiyat, urun.taksitSayisi) : null;

  const adimlar: KirintiAdimi[] = [];
  if (ustKategori) adimlar.push({ ad: ustKategori.ad, yol: `/kategori/${ustKategori.slug}` });
  if (kategoriAdi && kategoriSlug) adimlar.push({ ad: kategoriAdi, yol: `/kategori/${kategoriSlug}` });
  adimlar.push({ ad: urun.ad });

  const whatsappMesaji =
    `Merhaba, "${urun.ad}" ürünü hakkında bilgi almak istiyorum.` +
    (urun.stokKodu ? ` (Ürün kodu: ${urun.stokKodu})` : "");

  /* Google'ın ürünü zengin sonuçlarda gösterebilmesi için yapılandırılmış veri. */
  const yapisalVeri = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: urun.ad,
    description: urun.kisaAciklama ?? urun.aciklama ?? undefined,
    image: gorseller.map((g) => g.url),
    sku: urun.stokKodu ?? undefined,
    brand: markaAdi ? { "@type": "Brand", name: markaAdi } : undefined,
    offers:
      gecerliFiyat && !urun.fiyatGizli
        ? {
            "@type": "Offer",
            price: Number(gecerliFiyat),
            priceCurrency: "TRY",
            availability:
              urun.stokDurumu === "stokta"
                ? "https://schema.org/InStock"
                : urun.stokDurumu === "tukendi"
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/PreOrder",
            seller: { "@type": "Organization", name: iletisim.firmaAdi },
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(yapisalVeri) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <EkmekKirintisi adimlar={adimlar} />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <UrunGalerisi gorseller={gorseller} urunAdi={urun.ad} />

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {markaAdi && markaSlug && (
                <Link
                  href={`/marka/${markaSlug}`}
                  className="text-sm font-medium uppercase tracking-wider text-kiremit hover:underline"
                >
                  {markaAdi}
                </Link>
              )}
              {indirim && <Rozet ton="indirim">%{indirim} indirim</Rozet>}
              {urun.yeniUrun && <Rozet ton="yeni">Yeni</Rozet>}
            </div>

            <h1 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">
              {urun.ad}
            </h1>

            {urun.kisaAciklama && (
              <p className="mt-4 text-lg leading-relaxed text-murekkep-yumusak">
                {urun.kisaAciklama}
              </p>
            )}

            {/* Fiyat kutusu */}
            <div className="mt-7 rounded-kart border border-cizgi bg-yuzey p-5">
              {urun.fiyatGizli ? (
                <p className="font-baslik text-2xl text-kiremit">Fiyat için bize ulaşın</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="rakam font-baslik text-3xl text-murekkep sm:text-4xl">
                      {fiyatBicimle(gecerliFiyat)}
                    </span>
                    {indirim && (
                      <>
                        <span className="rakam text-lg text-solgun line-through">
                          {fiyatBicimle(urun.fiyat)}
                        </span>
                        <span className="rakam text-sm font-medium text-indirim">
                          {fiyatBicimle(Number(urun.fiyat) - Number(urun.indirimliFiyat))} kazanç
                        </span>
                      </>
                    )}
                  </div>
                  {taksit && (
                    <p className="rakam mt-2 flex items-center gap-1.5 text-sm text-murekkep-yumusak">
                      <CreditCard className="size-4 text-kiremit" />
                      {taksit}
                    </p>
                  )}
                </>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StokRozeti durum={urun.stokDurumu} />
                {urun.stokKodu && (
                  <span className="rakam text-xs text-solgun">Ürün kodu: {urun.stokKodu}</span>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <SepeteEkleButonu
                  urunId={urun.id}
                  ad={urun.ad}
                  slug={urun.slug}
                  fiyat={urun.fiyatGizli ? null : gecerliFiyat}
                  gorselUrl={gorseller[0]?.url ?? null}
                  markaAdi={markaAdi}
                  boyut="buyuk"
                  tamGenislik
                  etiket="Teklif sepetine ekle"
                />
                <DisBaglanti
                  href={whatsappBaglantisi(iletisim.whatsapp, whatsappMesaji)}
                  gorunum="whatsapp"
                  boyut="buyuk"
                  tamGenislik
                >
                  <WhatsappSimgesi className="size-5" />
                  WhatsApp&apos;tan sor
                </DisBaglanti>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-solgun">
                Teklif sepeti sipariş değildir. Sepetinizi tamamlayıp gönderdiğinizde sizi arayıp
                fiyat ve teslimat bilgisini netleştiriyoruz.
              </p>
            </div>

            {/* Hizmet vaatleri */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {urun.garantiSuresi && (
                <div className="flex items-start gap-2.5 rounded-yumusak bg-kum-koyu/60 p-3.5">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-kiremit" />
                  <div>
                    <p className="text-xs font-semibold text-murekkep">Garanti</p>
                    <p className="text-xs text-murekkep-yumusak">{urun.garantiSuresi}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 rounded-yumusak bg-kum-koyu/60 p-3.5">
                <Truck className="mt-0.5 size-4 shrink-0 text-kiremit" />
                <div>
                  <p className="text-xs font-semibold text-murekkep">Teslimat</p>
                  <p className="text-xs text-murekkep-yumusak">Malatya içi teslimat</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-yumusak bg-kum-koyu/60 p-3.5">
                <Package className="mt-0.5 size-4 shrink-0 text-kiremit" />
                <div>
                  <p className="text-xs font-semibold text-murekkep">Kurulum</p>
                  <p className="text-xs text-murekkep-yumusak">Montaj desteği</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Açıklama ve teknik özellikler */}
        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_24rem]">
          {urun.aciklama && (
            <section>
              <h2 className="kilavuz-cizgi font-baslik text-2xl text-murekkep">Ürün açıklaması</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-murekkep-yumusak">
                {urun.aciklama.split("\n").filter(Boolean).map((paragraf, i) => (
                  <p key={i}>{paragraf}</p>
                ))}
              </div>
            </section>
          )}

          {ozellikler.length > 0 && (
            <section>
              <h2 className="kilavuz-cizgi font-baslik text-2xl text-murekkep">Teknik özellikler</h2>
              <dl className="mt-4 overflow-hidden rounded-kart border border-cizgi">
                {ozellikler.map((ozellik, i) => (
                  <div
                    key={ozellik.id}
                    className={`flex gap-4 px-4 py-3 text-sm ${
                      i % 2 === 0 ? "bg-yuzey" : "bg-kum-koyu/40"
                    }`}
                  >
                    <dt className="w-2/5 shrink-0 text-murekkep-yumusak">{ozellik.ad}</dt>
                    <dd className="font-medium text-murekkep">{ozellik.deger}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        {benzerler.length > 0 && (
          <section className="mt-20">
            <BolumBasligi ustBaslik="Benzer" baslik="Bunlar da ilginizi çekebilir" />
            <UrunIzgarasi>
              {benzerler.map((benzer) => (
                <UrunKarti key={benzer.id} urun={benzer} />
              ))}
            </UrunIzgarasi>
          </section>
        )}
      </div>
    </>
  );
}
