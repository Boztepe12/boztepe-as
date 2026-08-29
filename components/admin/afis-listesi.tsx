"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ImageOff, Pencil, Trash2 } from "lucide-react";

import { afisDurumDegistir, afisSil } from "@/lib/eylemler/admin/icerik";
import { cn, tarihBicimle } from "@/lib/utils";

export type ListeAfisi = {
  id: number;
  baslik: string;
  altBaslik: string | null;
  gorselUrl: string | null;
  sira: number;
  aktif: boolean;
  baslangicTarihi: Date | string | null;
  bitisTarihi: Date | string | null;
};

export function AfisListesi({ afisler }: { afisler: ListeAfisi[] }) {
  const router = useRouter();
  const [islemde, basla] = useTransition();

  function calistir(is: () => Promise<{ durum: string; mesaj?: string }>) {
    basla(async () => {
      try {
        const sonuc = await is();
        if (sonuc.durum === "hata") {
          toast.error(sonuc.mesaj ?? "İşlem tamamlanamadı.");
          return;
        }
        if (sonuc.mesaj) toast.success(sonuc.mesaj);
        router.refresh();
      } catch {
        toast.error("İşlem tamamlanamadı. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {afisler.map((afis) => {
        const tarihMetni =
          afis.baslangicTarihi || afis.bitisTarihi
            ? `${afis.baslangicTarihi ? tarihBicimle(afis.baslangicTarihi) : "başlangıçsız"} → ${
                afis.bitisTarihi ? tarihBicimle(afis.bitisTarihi) : "süresiz"
              }`
            : "Süresiz";

        return (
          <div
            key={afis.id}
            className="flex flex-wrap items-center gap-4 rounded-kart border border-cizgi bg-yuzey p-4"
          >
            <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-yumusak border border-cizgi bg-kum">
              {afis.gorselUrl ? (
                <Image
                  src={afis.gorselUrl}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <ImageOff className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-solgun" />
              )}
            </div>

            <div className="min-w-40 flex-1">
              <Link
                href={`/admin/afisler/${afis.id}`}
                className="font-medium text-murekkep hover:text-kiremit"
              >
                {afis.baslik}
              </Link>
              {afis.altBaslik && (
                <p className="mt-0.5 line-clamp-1 text-sm text-murekkep-yumusak">
                  {afis.altBaslik}
                </p>
              )}
              <p className="rakam mt-1 text-xs text-solgun">
                {tarihMetni} · sıra {afis.sira}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={afis.aktif}
                aria-label={`${afis.baslik} yayın durumu`}
                disabled={islemde}
                onClick={() => calistir(() => afisDurumDegistir(afis.id, !afis.aktif))}
                className={cn(
                  "flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition-colors md:h-6 md:w-11",
                  "disabled:opacity-50",
                  afis.aktif ? "bg-onay" : "bg-cizgi-koyu",
                )}
              >
                <span
                  className={cn(
                    "size-6 rounded-full bg-white shadow-sm transition-transform md:size-5",
                    afis.aktif && "translate-x-5",
                  )}
                />
              </button>

              <Link
                href={`/admin/afisler/${afis.id}`}
                aria-label={`${afis.baslik} düzenle`}
                className="rounded-yumusak p-2.5 text-murekkep-yumusak md:p-2 transition-colors hover:bg-kum-koyu hover:text-murekkep"
              >
                <Pencil className="size-4" />
              </Link>

              <button
                type="button"
                disabled={islemde}
                aria-label={`${afis.baslik} sil`}
                onClick={() => {
                  const onay = window.confirm(`"${afis.baslik}" silinecek. Devam edilsin mi?`);
                  if (onay) calistir(() => afisSil(afis.id));
                }}
                className="rounded-yumusak p-2.5 text-murekkep-yumusak md:p-2 transition-colors hover:bg-hata/10 hover:text-hata disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
