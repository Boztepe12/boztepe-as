"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, FileText, Link2, Pencil, Trash2 } from "lucide-react";

import { katalogDurumu, katalogSil } from "@/lib/eylemler/admin/kataloglar";
import { cn } from "@/lib/utils";

export type ListeKatalogu = {
  id: number;
  baslik: string;
  grup: string | null;
  tur: "pdf" | "baglanti";
  baglanti: string | null;
  kapakUrl: string | null;
  sira: number;
  aktif: boolean;
};

/** Admin → Kataloglar listesi, gruplara ayrılmış; yayın anahtarı, düzenle, sil. */
export function KatalogKayitListesi({ kataloglar }: { kataloglar: ListeKatalogu[] }) {
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

  const gruplar = new Map<string, ListeKatalogu[]>();
  for (const k of kataloglar) {
    const ad = k.grup?.trim() || "Grupsuz";
    gruplar.set(ad, [...(gruplar.get(ad) ?? []), k]);
  }

  return (
    <div className="space-y-8">
      {[...gruplar.entries()].map(([grup, liste]) => (
        <section key={grup}>
          <h2 className="mb-3 font-govde text-sm font-semibold uppercase tracking-wide text-solgun">{grup}</h2>
          <div className="space-y-3">
            {liste.map((k) => (
              <div key={k.id} className="flex flex-wrap items-center gap-4 rounded-kart border border-cizgi bg-yuzey p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-yumusak border border-cizgi bg-kum">
                  {k.kapakUrl ? (
                    <Image src={k.kapakUrl} alt="" fill sizes="64px" className="object-contain p-1" />
                  ) : (
                    <FileText className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-solgun" />
                  )}
                </div>
                <div className="min-w-40 flex-1">
                  <Link href={`/admin/kataloglar/${k.id}`} className="font-medium text-murekkep hover:text-kiremit">
                    {k.baslik}
                  </Link>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-solgun">
                    {k.tur === "pdf" ? <FileText className="size-3.5" /> : <Link2 className="size-3.5" />}
                    {k.tur === "pdf" ? "PDF" : "Web sitesi"}
                    {k.baglanti && (
                      <a href={k.baglanti} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-kiremit">
                        · aç <ExternalLink className="size-3" />
                      </a>
                    )}
                    <span className="rakam">· sıra {k.sira}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={k.aktif}
                    aria-label={`${k.baslik} yayın durumu`}
                    disabled={islemde}
                    onClick={() => calistir(() => katalogDurumu(k.id, !k.aktif))}
                    className={cn(
                      "flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition-colors md:h-6 md:w-11 disabled:opacity-50",
                      k.aktif ? "bg-onay" : "bg-cizgi-koyu",
                    )}
                  >
                    <span className={cn("size-6 rounded-full bg-white shadow-sm transition-transform md:size-5", k.aktif && "translate-x-5")} />
                  </button>
                  <Link
                    href={`/admin/kataloglar/${k.id}`}
                    aria-label={`${k.baslik} düzenle`}
                    className="rounded-yumusak p-2.5 text-murekkep-yumusak transition-colors hover:bg-kum-koyu hover:text-murekkep md:p-2"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={islemde}
                    aria-label={`${k.baslik} sil`}
                    onClick={() => {
                      if (window.confirm(`"${k.baslik}" silinecek${k.tur === "pdf" ? " (PDF dosyası da)" : ""}. Devam edilsin mi?`)) {
                        calistir(() => katalogSil(k.id));
                      }
                    }}
                    className="rounded-yumusak p-2.5 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata disabled:opacity-50 md:p-2"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
