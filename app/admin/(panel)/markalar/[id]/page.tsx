import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { KatalogFormu } from "@/components/admin/katalog-formu";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { TekilGorsel } from "@/components/admin/tekil-gorsel";
import { markaLogosuKaldir, markaLogosuYukle } from "@/lib/eylemler/admin/katalog";
import { yoneticiMarkaGetir } from "@/lib/sorgular/admin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const kayit = await yoneticiMarkaGetir(Number(id));
  return { title: kayit ? kayit.ad : "Marka" };
}

export default async function MarkaDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const markaId = Number(id);
  if (!Number.isInteger(markaId) || markaId < 1) notFound();

  const kayit = await yoneticiMarkaGetir(markaId);
  if (!kayit) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/markalar"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit"
      >
        <ArrowLeft className="size-3.5" />
        Markalar
      </Link>

      <SayfaBasligi
        baslik={kayit.ad}
        aciklama={kayit.aktif ? "Bu marka sitede yayında." : "Bu marka yayında değil."}
      />

      <div className="mb-5">
        <TekilGorsel
          id={markaId}
          gorselUrl={kayit.logoUrl}
          baslik="Marka logosu"
          aciklama="Markalar sayfasında ve ana sayfadaki marka şeridinde görünür."
          yukle={markaLogosuYukle}
          kaldir={markaLogosuKaldir}
          kare
        />
      </div>

      <KatalogFormu
        tur="marka"
        kayit={{
          id: kayit.id,
          ad: kayit.ad,
          slug: kayit.slug,
          aciklama: kayit.aciklama,
          sira: kayit.sira,
          aktif: kayit.aktif,
        }}
      />
    </div>
  );
}
