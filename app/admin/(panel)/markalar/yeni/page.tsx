import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { KatalogFormu } from "@/components/admin/katalog-formu";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";

export const metadata: Metadata = { title: "Yeni marka" };

export default function YeniMarkaSayfasi() {
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
        baslik="Yeni marka"
        aciklama="Kaydettikten sonra marka logosunu ekleyebilirsiniz."
      />

      <KatalogFormu tur="marka" />
    </div>
  );
}
