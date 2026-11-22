import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { KatalogKayitFormu } from "@/components/admin/katalog-kayit-formu";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { katalogGruplari } from "@/lib/sorgular/admin";

export const metadata: Metadata = { title: "Yeni katalog" };

export default async function YeniKatalogSayfasi() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/kataloglar" className="mb-4 inline-flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit">
        <ArrowLeft className="size-3.5" />
        Kataloglar
      </Link>
      <SayfaBasligi baslik="Yeni katalog" aciklama="Kapak görselini, dosyayı ve bilgileri doldurup kaydedin." />
      <KatalogKayitFormu gruplar={await katalogGruplari()} />
    </div>
  );
}
