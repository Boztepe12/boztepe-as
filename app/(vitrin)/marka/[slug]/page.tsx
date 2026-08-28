import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { UrunListeleme, type AramaParametreleri } from "@/components/site/urun-listeleme";
import { aktifMarkalar, markaGetir } from "@/lib/sorgular/icerik";

export const revalidate = 3600;

export async function generateStaticParams() {
  const markalar = await aktifMarkalar();
  return markalar.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const marka = await markaGetir(slug);
  if (!marka) return { title: "Marka bulunamadı" };

  return {
    title: `${marka.ad} Ürünleri`,
    description: marka.aciklama ?? `${marka.ad} markasının Boztepe A.Ş. mağazasındaki ürünleri.`,
    alternates: { canonical: `/marka/${marka.slug}` },
  };
}

export default async function MarkaSayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<AramaParametreleri>;
}) {
  const [{ slug }, parametreler] = await Promise.all([params, searchParams]);
  const marka = await markaGetir(slug);

  if (!marka) notFound();

  return (
    <UrunListeleme
      baslik={`${marka.ad} Ürünleri`}
      aciklama={marka.aciklama}
      markaSlug={marka.slug}
      parametreler={parametreler}
      ekmekKirintisi={
        <EkmekKirintisi adimlar={[{ ad: "Markalar", yol: "/markalar" }, { ad: marka.ad }]} />
      }
    />
  );
}
