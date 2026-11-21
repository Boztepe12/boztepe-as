import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { KatalogFormu } from "@/components/admin/katalog-formu";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { tumKategoriler } from "@/lib/sorgular/admin";
import { stokBaglantisiVar } from "@/lib/stok/istemci";

export const metadata: Metadata = { title: "Yeni kategori" };

export default async function YeniKategoriSayfasi() {
  const kategoriler = await tumKategoriler();

  /* Şema iki seviyeli: yalnızca üst seviye kategoriler üst olarak seçilebilir. */
  const ustSecenekleri = kategoriler
    .filter((kategori) => !kategori.ustKategoriId)
    .map((kategori) => ({ id: kategori.id, etiket: kategori.ad }));

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
        baslik="Yeni kategori"
        aciklama="Kaydettikten sonra kategori görselini ekleyebilirsiniz."
      />

      {stokBaglantisiVar() ? (
        <p className="rounded-kart border border-cizgi bg-yuzey p-5 text-sm text-murekkep-yumusak">
          Kategoriler stok sisteminden (Selstok) gelir. Yeni kategoriyi Selstok panelinde açın; bir sonraki eşitlemede
          (ya da hemen, Stok Bağlantısı → Şimdi eşitle) siteye gelir.
        </p>
      ) : (
        <KatalogFormu tur="kategori" ustSecenekleri={ustSecenekleri} />
      )}
    </div>
  );
}
