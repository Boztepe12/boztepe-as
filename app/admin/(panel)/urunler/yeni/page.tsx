import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { UrunFormu } from "@/components/admin/urun-formu";
import { formSecenekleri } from "@/lib/sorgular/admin";

export const metadata: Metadata = { title: "Yeni ürün" };

export default async function YeniUrunSayfasi() {
  const secenekler = await formSecenekleri();

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
        baslik="Yeni ürün"
        aciklama="Ürünü kaydettikten sonra fotoğraflarını ekleyebilirsiniz."
      />

      <UrunFormu secenekler={secenekler} />
    </div>
  );
}
