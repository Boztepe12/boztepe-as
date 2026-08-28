import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, TicketPercent } from "lucide-react";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { UrunIzgarasi, UrunKarti } from "@/components/site/urun-karti";
import { ButonBaglanti } from "@/components/ui/buton";
import { BolumBasligi, BosDurum } from "@/components/ui/durum";
import { yayindakiAfisler } from "@/lib/sorgular/icerik";
import { urunleriListele } from "@/lib/sorgular/urunler";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Kampanyalar",
  description:
    "Boztepe A.Ş. güncel kampanyaları ve indirimdeki ürünleri. Beyaz eşya, mobilya ve halıda fırsatlar.",
};

export default async function KampanyalarSayfasi() {
  const [afisler, indirimliler] = await Promise.all([
    yayindakiAfisler(),
    urunleriListele({ sadeceIndirimli: true, siralama: "onerilen", sayfaBoyutu: 60 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <EkmekKirintisi adimlar={[{ ad: "Kampanyalar" }]} />

      <header className="mb-10">
        <h1 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">
          Kampanyalar
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-murekkep-yumusak">
          Güncel indirimlerimiz ve fırsat ürünlerimiz. Stoklar sınırlıdır, fiyatlar önceden haber
          verilmeksizin değişebilir.
        </p>
      </header>

      {afisler.length > 0 && (
        <section className="mb-14">
          <div className="grid gap-5 md:grid-cols-2">
            {afisler.map((afis) => (
              <Link
                key={afis.id}
                href={afis.baglanti ?? "/urunler"}
                className="group relative overflow-hidden rounded-kart shadow-kart transition-shadow hover:shadow-kart-hover"
              >
                <div className="relative aspect-16/9">
                  {afis.gorselUrl && (
                    <Image
                      src={afis.gorselUrl}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-murekkep/85 via-murekkep/30 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h2 className="font-baslik text-2xl text-white">{afis.baslik}</h2>
                  {afis.altBaslik && (
                    <p className="mt-1.5 text-sm text-white/85">{afis.altBaslik}</p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white">
                    {afis.butonMetni ?? "İncele"}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <BolumBasligi
          ustBaslik="Fırsatlar"
          baslik="İndirimdeki ürünler"
          aciklama={`Şu an ${indirimliler.toplam} üründe indirim var.`}
        />

        {indirimliler.urunler.length === 0 ? (
          <BosDurum
            simge={<TicketPercent className="size-10" />}
            baslik="Şu an aktif indirim yok"
            aciklama="Yeni kampanyalarımız için takipte kalın ya da aradığınız ürünü WhatsApp'tan sorun."
            eylem={<ButonBaglanti href="/urunler">Tüm ürünlere göz at</ButonBaglanti>}
          />
        ) : (
          <UrunIzgarasi>
            {indirimliler.urunler.map((urun, i) => (
              <UrunKarti key={urun.id} urun={urun} oncelikli={i < 4} />
            ))}
          </UrunIzgarasi>
        )}
      </section>
    </div>
  );
}
