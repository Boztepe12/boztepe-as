import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { aktifMarkalar } from "@/lib/sorgular/icerik";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Markalar",
  description:
    "Boztepe A.Ş. bünyesinde satışını yaptığımız markalar: Vestel, Vilinze, Venti, Slims, Arno Home, Turuncu Mobilya, Castor ve daha fazlası.",
  alternates: { canonical: "/markalar" },
};

export default async function MarkalarSayfasi() {
  const markalar = await aktifMarkalar();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <EkmekKirintisi adimlar={[{ ad: "Markalar" }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">Markalar</h1>
        <p className="mt-3 leading-relaxed text-murekkep-yumusak">
          Beyaz eşyada Vestel yetkili bayisiyiz; mobilya ve halıda ise özenle seçtiğimiz üreticilerle
          çalışıyoruz.
        </p>
      </header>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {markalar.map((marka) => (
          <Link
            key={marka.id}
            href={`/marka/${marka.slug}`}
            className="group flex flex-col rounded-kart border border-cizgi bg-yuzey p-6 shadow-kart transition-shadow hover:shadow-kart-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-baslik text-2xl text-murekkep group-hover:text-kiremit">
                {marka.ad}
              </h2>
              <span className="rakam shrink-0 rounded-full bg-kum-koyu px-2.5 py-1 text-xs text-murekkep-yumusak">
                {marka.urunAdedi} ürün
              </span>
            </div>

            {marka.aciklama && (
              <p className="mt-3 flex-1 text-sm leading-relaxed text-murekkep-yumusak">
                {marka.aciklama}
              </p>
            )}

            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-kiremit">
              Ürünleri gör
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
