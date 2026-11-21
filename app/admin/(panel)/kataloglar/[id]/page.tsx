import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { KatalogKayitFormu } from "@/components/admin/katalog-kayit-formu";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { TekilGorsel } from "@/components/admin/tekil-gorsel";
import { katalogKapagiKaldir, katalogKapagiYukle } from "@/lib/eylemler/admin/kataloglar";
import { katalogGruplari, yoneticiKatalogGetir } from "@/lib/sorgular/admin";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const kayit = await yoneticiKatalogGetir(Number((await params).id));
  return { title: kayit ? kayit.baslik : "Katalog" };
}

export default async function KatalogDuzenleSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [kayit, gruplar] = await Promise.all([yoneticiKatalogGetir(id), katalogGruplari()]);
  if (!kayit) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/kataloglar" className="mb-4 inline-flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit">
        <ArrowLeft className="size-3.5" />
        Kataloglar
      </Link>
      <SayfaBasligi baslik={kayit.baslik} aciklama={kayit.aktif ? "Bu katalog sitede yayında." : "Bu katalog yayında değil."} />
      <div className="mb-5">
        <TekilGorsel
          id={id}
          gorselUrl={kayit.kapakUrl}
          baslik="Kapak görseli"
          aciklama="Kataloğun kapağı ya da markanın logosu; sayfadaki kartta görünür."
          yukle={katalogKapagiYukle}
          kaldir={katalogKapagiKaldir}
          kare
        />
      </div>
      <KatalogKayitFormu katalog={kayit} gruplar={gruplar} />
    </div>
  );
}
