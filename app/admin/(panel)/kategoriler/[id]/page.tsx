import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { KatalogFormu } from "@/components/admin/katalog-formu";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { TekilGorsel } from "@/components/admin/tekil-gorsel";
import { kategoriGorseliKaldir, kategoriGorseliYukle } from "@/lib/eylemler/admin/katalog";
import { tumKategoriler, yoneticiKategoriGetir } from "@/lib/sorgular/admin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const kayit = await yoneticiKategoriGetir(Number(id));
  return { title: kayit ? kayit.ad : "Kategori" };
}

export default async function KategoriDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kategoriId = Number(id);
  if (!Number.isInteger(kategoriId) || kategoriId < 1) notFound();

  const [kayit, hepsi] = await Promise.all([
    yoneticiKategoriGetir(kategoriId),
    tumKategoriler(),
  ]);
  if (!kayit) notFound();

  /* Kategori kendini üst kategori olarak seçemez; listeden çıkarıyoruz. */
  const ustSecenekleri = hepsi
    .filter((kategori) => !kategori.ustKategoriId && kategori.id !== kategoriId)
    .map((kategori) => ({ id: kategori.id, etiket: kategori.ad }));

  const altAdedi = hepsi.filter((kategori) => kategori.ustKategoriId === kategoriId).length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/kategoriler"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit"
      >
        <ArrowLeft className="size-3.5" />
        Kategoriler
      </Link>

      <SayfaBasligi
        baslik={kayit.ad}
        aciklama={
          altAdedi > 0
            ? `${altAdedi} alt kategorisi var.`
            : kayit.aktif
              ? "Bu kategori sitede yayında."
              : "Bu kategori yayında değil."
        }
      />

      <div className="mb-5">
        <TekilGorsel
          id={kategoriId}
          gorselUrl={kayit.gorselUrl}
          baslik="Kategori görseli"
          aciklama="Ana sayfadaki kategori kartında kullanılır."
          yukle={kategoriGorseliYukle}
          kaldir={kategoriGorseliKaldir}
        />
      </div>

      <KatalogFormu
        tur="kategori"
        kayit={{
          id: kayit.id,
          ad: kayit.ad,
          slug: kayit.slug,
          aciklama: kayit.aciklama,
          sira: kayit.sira,
          aktif: kayit.aktif,
          ustKategoriId: kayit.ustKategoriId,
          anaSayfadaGoster: kayit.anaSayfadaGoster,
          seoBaslik: kayit.seoBaslik,
          seoAciklama: kayit.seoAciklama,
        }}
        ustSecenekleri={ustSecenekleri}
      />
    </div>
  );
}
