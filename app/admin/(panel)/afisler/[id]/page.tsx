import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AfisFormu, type FormAfisi } from "@/components/admin/afis-formu";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { TekilGorsel } from "@/components/admin/tekil-gorsel";
import {
  afisMasaustuGorseliKaldir,
  afisMasaustuGorseliYukle,
  afisMobilGorseliKaldir,
  afisMobilGorseliYukle,
} from "@/lib/eylemler/admin/icerik";
import { yoneticiAfisGetir } from "@/lib/sorgular/admin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const kayit = await yoneticiAfisGetir(Number(id));
  return { title: kayit ? kayit.baslik : "Afiş" };
}

export default async function AfisDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const afisId = Number(id);
  if (!Number.isInteger(afisId) || afisId < 1) notFound();

  const kayit = await yoneticiAfisGetir(afisId);
  if (!kayit) notFound();

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
        baslik={kayit.baslik}
        aciklama={kayit.aktif ? "Bu afiş yayında." : "Bu afiş yayında değil."}
      />

      <div className="mb-5 space-y-5">
        <TekilGorsel
          id={afisId}
          gorselUrl={kayit.gorselUrl}
          baslik="Afiş görseli"
          aciklama="Geniş ekranlarda kullanılır. Önerilen ölçü 1600 × 700 piksel."
          yukle={afisMasaustuGorseliYukle}
          kaldir={afisMasaustuGorseliKaldir}
        />

        <TekilGorsel
          id={afisId}
          gorselUrl={kayit.mobilGorselUrl}
          baslik="Mobil görsel"
          aciklama="Boş bırakılırsa telefonlarda da yukarıdaki görsel kullanılır."
          yukle={afisMobilGorseliYukle}
          kaldir={afisMobilGorseliKaldir}
          kare
        />
      </div>

      <AfisFormu afis={kayit as FormAfisi} />
    </div>
  );
}
