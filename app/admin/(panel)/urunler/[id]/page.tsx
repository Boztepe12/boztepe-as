import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { GorselYonetimi } from "@/components/admin/gorsel-yonetimi";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { UrunFormu, type FormUrunu } from "@/components/admin/urun-formu";
import { formSecenekleri, yoneticiUrunGetir } from "@/lib/sorgular/admin";
import { cloudinaryHazir } from "@/lib/storage";
import { kisalt } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const kayit = await yoneticiUrunGetir(Number(id));
  return { title: kayit ? kisalt(kayit.urun.ad, 60) : "Ürün" };
}

export default async function UrunDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const urunId = Number(id);
  if (!Number.isInteger(urunId) || urunId < 1) notFound();

  const [kayit, secenekler] = await Promise.all([yoneticiUrunGetir(urunId), formSecenekleri()]);
  if (!kayit) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/urunler"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit"
      >
        <ArrowLeft className="size-3.5" />
        Ürünler
      </Link>

      <SayfaBasligi
        baslik={kayit.urun.ad}
        aciklama={kayit.urun.aktif ? "Bu ürün sitede yayında." : "Bu ürün yayında değil."}
      />

      <div className="mb-5">
        <GorselYonetimi
          urunId={urunId}
          gorseller={kayit.gorseller.map((gorsel) => ({
            id: gorsel.id,
            url: gorsel.url,
            altMetin: gorsel.altMetin,
          }))}
          cloudinaryHazir={cloudinaryHazir}
        />
      </div>

      <UrunFormu
        urun={kayit.urun as FormUrunu}
        ozellikler={kayit.ozellikler.map((ozellik) => ({
          ad: ozellik.ad,
          deger: ozellik.deger,
        }))}
        secenekler={secenekler}
      />
    </div>
  );
}
