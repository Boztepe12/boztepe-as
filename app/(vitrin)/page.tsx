import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Truck, Wrench } from "lucide-react";

import { AfisKaydiragi } from "@/components/site/afis-kaydiragi";
import { UrunIzgarasi, UrunKarti } from "@/components/site/urun-karti";
import { ButonBaglanti } from "@/components/ui/buton";
import { BolumBasligi } from "@/components/ui/durum";
import { aktifMarkalar, ayarGetir, yayindakiAfisler } from "@/lib/sorgular/icerik";
import { anaKategoriler } from "@/lib/sorgular/kategoriler";
import { indirimliUrunler, oneCikanUrunler, yeniUrunler } from "@/lib/sorgular/urunler";

/* Katalog sık değişmiyor; sayfayı önbellekleyip her saat tazeliyoruz. */
export const revalidate = 3600;

const GUVEN_MADDELERI = [
  {
    simge: BadgeCheck,
    baslik: "1963'ten beri",
    metin: "Üç kuşaktır Malatya'da, aynı isimle hizmetteyiz.",
  },
  {
    simge: ShieldCheck,
    baslik: "Fabrika garantisi",
    metin: "Vestel yetkili bayisi olarak tüm ürünler garantili.",
  },
  {
    simge: Wrench,
    baslik: "Kurulum desteği",
    metin: "Beyaz eşya ve mobilyada montajı ekibimiz yapar.",
  },
  {
    simge: Truck,
    baslik: "Şehir içi teslimat",
    metin: "Malatya içi teslimat ve yerleştirme hizmeti.",
  },
];

export default async function AnaSayfa() {
  const [afisler, kategoriler, indirimliler, oneCikanlar, yeniler, markalar, hakkimizda] =
    await Promise.all([
      yayindakiAfisler(),
      anaKategoriler(),
      indirimliUrunler(8),
      oneCikanUrunler(8),
      yeniUrunler(4),
      aktifMarkalar(),
      ayarGetir("hakkimizda"),
    ]);

  return (
    <>
      <AfisKaydiragi afisler={afisler} />

      {/* Güven bandı */}
      <section className="border-b border-cizgi bg-yuzey">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-7 px-4 py-9 sm:px-6 lg:grid-cols-4">
          {GUVEN_MADDELERI.map(({ simge: Simge, baslik, metin }) => (
            <div key={baslik} className="flex gap-3">
              <Simge className="mt-0.5 size-5 shrink-0 text-kiremit" />
              <div>
                <p className="text-sm font-semibold text-murekkep">{baslik}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-murekkep-yumusak">{metin}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kategoriler */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <BolumBasligi
          ustBaslik="Ne arıyorsunuz?"
          baslik="Evinizin her köşesi için"
          aciklama="Beyaz eşyadan mobilyaya, halıdan küçük ev aletlerine kadar ihtiyacınız olan her şey tek adreste."
        />

        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {kategoriler.map((kategori, indeks) => (
            <Link
              key={kategori.id}
              href={`/kategori/${kategori.slug}`}
              className="group relative overflow-hidden rounded-kart bg-kum-koyu shadow-kart transition-shadow hover:shadow-kart-hover"
            >
              <div className="relative aspect-4/3">
                {kategori.gorselUrl && (
                  <Image
                    src={kategori.gorselUrl}
                    alt=""
                    fill
                    priority={indeks === 0}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-murekkep/85 via-murekkep/25 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-baslik text-2xl text-white">{kategori.ad}</h3>
                {kategori.aciklama && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-white/80">{kategori.aciklama}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white">
                  İncele
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* İndirimdekiler */}
      {indirimliler.length > 0 && (
        <section className="border-y border-cizgi bg-yuzey">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <BolumBasligi
              ustBaslik="Fırsatlar"
              baslik="İndirimdeki ürünler"
              aciklama="Sınırlı sayıda, kaçırmayın. Fiyatlar ve stok durumu değişebilir."
              eylem={
                <ButonBaglanti href="/kampanyalar" gorunum="ikincil" boyut="orta">
                  Tüm kampanyalar
                  <ArrowRight className="size-4" />
                </ButonBaglanti>
              }
            />
            <UrunIzgarasi>
              {indirimliler.map((urun, i) => (
                <UrunKarti key={urun.id} urun={urun} oncelikli={i < 4} />
              ))}
            </UrunIzgarasi>
          </div>
        </section>
      )}

      {/* Öne çıkanlar */}
      {oneCikanlar.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <BolumBasligi
            ustBaslik="Seçkimiz"
            baslik="Öne çıkan ürünler"
            aciklama="Mağazamızda en çok tercih edilen, bizim de gönül rahatlığıyla önerdiğimiz ürünler."
            eylem={
              <ButonBaglanti href="/urunler" gorunum="ikincil" boyut="orta">
                Tüm ürünler
                <ArrowRight className="size-4" />
              </ButonBaglanti>
            }
          />
          <UrunIzgarasi>
            {oneCikanlar.map((urun) => (
              <UrunKarti key={urun.id} urun={urun} />
            ))}
          </UrunIzgarasi>
        </section>
      )}

      {/* Hakkımızda şeridi */}
      <section className="border-y border-cizgi bg-kum-koyu/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="kilavuz-cizgi mb-2 text-xs font-medium uppercase tracking-[0.18em] text-kiremit">
              Hakkımızda
            </p>
            <h2 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">
              {hakkimizda.baslik}
            </h2>
            {hakkimizda.ozet && (
              <p className="mt-5 leading-relaxed text-murekkep-yumusak">{hakkimizda.ozet}</p>
            )}
            <ButonBaglanti href="/hakkimizda" gorunum="ikincil" boyut="orta" className="mt-7">
              Hikâyemizi okuyun
              <ArrowRight className="size-4" />
            </ButonBaglanti>
          </div>

          {hakkimizda.degerler.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {hakkimizda.degerler.map((deger) => (
                <div
                  key={deger.baslik}
                  className="rounded-kart border border-cizgi bg-yuzey p-5 shadow-kart"
                >
                  <h3 className="font-govde text-[0.9375rem] font-semibold text-murekkep">
                    {deger.baslik}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-murekkep-yumusak">
                    {deger.metin}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Yeni gelenler */}
      {yeniler.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <BolumBasligi ustBaslik="Yeni" baslik="Yeni gelenler" />
          <UrunIzgarasi>
            {yeniler.map((urun) => (
              <UrunKarti key={urun.id} urun={urun} />
            ))}
          </UrunIzgarasi>
        </section>
      )}

      {/* Markalar */}
      {markalar.length > 0 && (
        <section className="border-t border-cizgi bg-yuzey">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <h2 className="mb-8 text-center text-xs font-medium uppercase tracking-[0.18em] text-solgun">
              Çalıştığımız markalar
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {markalar.map((marka) => (
                <Link
                  key={marka.id}
                  href={`/marka/${marka.slug}`}
                  className="rounded-yumusak border border-cizgi px-5 py-3 text-sm font-medium text-murekkep-yumusak transition-colors hover:border-kiremit hover:text-kiremit"
                >
                  {marka.ad}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
