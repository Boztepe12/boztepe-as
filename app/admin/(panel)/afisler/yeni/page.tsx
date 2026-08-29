import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AfisFormu } from "@/components/admin/afis-formu";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";

export const metadata: Metadata = { title: "Yeni afiş" };

export default function YeniAfisSayfasi() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/afisler"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit"
      >
        <ArrowLeft className="size-3.5" />
        Afişler
      </Link>

      <SayfaBasligi
        baslik="Yeni afiş"
        aciklama="Kaydettikten sonra afiş görselini ekleyebilirsiniz."
      />

      <AfisFormu />
    </div>
  );
}
