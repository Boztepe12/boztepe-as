import type { Metadata } from "next";
import { ImageOff } from "lucide-react";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import { galeri } from "@/lib/sorgular/icerik";

import { GaleriIzgarasi } from "./galeri-izgarasi";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Galeri",
  description: "Boztepe A.Ş. mağazamızdan kareler — showroom, ürün teşhiri ve ekibimiz.",
  alternates: { canonical: "/galeri" },
};

export default async function GaleriSayfasi() {
  const gorseller = await galeri();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <EkmekKirintisi adimlar={[{ ad: "Galeri" }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">Galeri</h1>
        <p className="mt-3 leading-relaxed text-murekkep-yumusak">
          Mağazamızdan kareler. Ürünleri yerinde görmek isterseniz showroomumuza bekleriz.
        </p>
      </header>

      {gorseller.length === 0 ? (
        <BosDurum
          simge={<ImageOff className="size-10" />}
          baslik="Galeri henüz boş"
          aciklama="Yakında mağazamızdan fotoğraflar ekleyeceğiz."
          eylem={<ButonBaglanti href="/urunler">Ürünlere göz at</ButonBaglanti>}
        />
      ) : (
        <GaleriIzgarasi gorseller={gorseller} />
      )}
    </div>
  );
}
