import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EkmekKirintisi, type KirintiAdimi } from "@/components/site/ekmek-kirintisi";
import { UrunListeleme, type AramaParametreleri } from "@/components/site/urun-listeleme";
import { kategoriGetir } from "@/lib/sorgular/kategoriler";

export const revalidate = 3600;

/*
 * Bu sayfa `searchParams` okuyor (marka, fiyat, sıralama, sayfa filtreleri), bu yüzden
 * Next tarafından her zaman istek anında üretiliyor. `generateStaticParams` yazmak
 * derleme sırasında boşuna bir veritabanı sorgusu anlamına gelirdi; arama motorları
 * için kategori adresleri zaten `app/sitemap.ts` içinde listeleniyor.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kategori = await kategoriGetir(slug);
  if (!kategori) return { title: "Kategori bulunamadı" };

  return {
    title: kategori.seoBaslik ?? kategori.ad,
    description: kategori.seoAciklama ?? kategori.aciklama ?? undefined,
    alternates: { canonical: `/kategori/${kategori.slug}` },
  };
}

export default async function KategoriSayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<AramaParametreleri>;
}) {
  const [{ slug }, parametreler] = await Promise.all([params, searchParams]);
  const kategori = await kategoriGetir(slug);

  if (!kategori) notFound();

  const adimlar: KirintiAdimi[] = kategori.ustKategori
    ? [
        { ad: kategori.ustKategori.ad, yol: `/kategori/${kategori.ustKategori.slug}` },
        { ad: kategori.ad },
      ]
    : [{ ad: kategori.ad }];

  return (
    <>
      <UrunListeleme
        baslik={kategori.ad}
        aciklama={kategori.aciklama}
        kategoriSlug={kategori.slug}
        parametreler={parametreler}
        ekmekKirintisi={
          <>
            <EkmekKirintisi adimlar={adimlar} />
            {kategori.altKategoriler.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                {kategori.altKategoriler.map((alt) => (
                  <Link
                    key={alt.id}
                    href={`/kategori/${alt.slug}`}
                    className="rounded-full border border-cizgi-koyu bg-yuzey px-4 py-2 text-sm text-murekkep transition-colors hover:border-kiremit hover:text-kiremit"
                  >
                    {alt.ad}
                  </Link>
                ))}
              </div>
            )}
          </>
        }
      />
    </>
  );
}
