import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { GorselYonetimi } from "@/components/admin/gorsel-yonetimi";
import { Panel, SayfaBasligi } from "@/components/admin/panel-parcalari";
import { UrunStokAyari } from "@/components/admin/stok-entegrasyonu";
import { UrunFormu, type FormUrunu } from "@/components/admin/urun-formu";
import { formSecenekleri, yoneticiUrunGetir } from "@/lib/sorgular/admin";
import { cloudinaryHazir } from "@/lib/storage";
import { fiyatBicimle, kisalt, tarihSaatBicimle } from "@/lib/utils";

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

      {kayit.urun.stokBarkod && (
        <Panel baslik="Stok sisteminden" className="mb-5"
          aciklama={kayit.urun.stokKaldirildi ? "Bu ürün stok sisteminde kaldırıldı; sitede gösterilmiyor." : "Barkod, stok ve liste fiyatı Boztepe'nin stok sisteminden gelir."}>
          <div className="grid gap-4 p-5 text-sm sm:grid-cols-[1fr_1.4fr]">
            <dl className="space-y-1.5">
              <div className="flex justify-between gap-3"><dt className="text-murekkep-yumusak">Barkod</dt><dd className="font-mono">{kayit.urun.stokBarkod}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-murekkep-yumusak">Stok</dt><dd className="rakam">{Number(kayit.urun.stokMiktari ?? 0).toLocaleString("tr-TR")}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-murekkep-yumusak">Liste fiyatı</dt><dd className="rakam">{kayit.urun.stokListeFiyati ? fiyatBicimle(kayit.urun.stokListeFiyati, true) : "girilmemiş"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-murekkep-yumusak">Son eşitleme</dt><dd>{tarihSaatBicimle(kayit.urun.stokEsitlemeTarihi)}</dd></div>
            </dl>
            <UrunStokAyari id={urunId} fiyatStoktan={kayit.urun.fiyatStoktan} stokDurumuStoktan={kayit.urun.stokDurumuStoktan} />
          </div>
        </Panel>
      )}

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
