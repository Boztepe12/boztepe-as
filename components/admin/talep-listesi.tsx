"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

import {
  TabloSarmali,
  TalepDurumRozeti,
  TALEP_DURUM_LISTESI,
  type TalepDurumu,
} from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { Secim } from "@/components/ui/form";
import { taleplerToplu } from "@/lib/eylemler/admin/talep";
import { cn, fiyatBicimle, tarihSaatBicimle, telefonBicimle } from "@/lib/utils";

export type ListeTalebi = {
  id: number;
  kod: string;
  adSoyad: string;
  telefon: string;
  eposta: string | null;
  durum: TalepDurumu;
  toplamTutar: string | null;
  olusturmaTarihi: Date | string;
  kalemAdedi: number;
};

export function TalepListesi({ talepler }: { talepler: ListeTalebi[] }) {
  const router = useRouter();
  const [secili, setSecili] = useState<number[]>([]);
  const [topluDurum, setTopluDurum] = useState<TalepDurumu>("arandi");
  const [islemde, basla] = useTransition();

  const hepsiSecili = talepler.length > 0 && secili.length === talepler.length;

  function topluUygula() {
    basla(async () => {
      try {
        const sonuc = await taleplerToplu(secili, topluDurum);
        if (sonuc.durum === "hata") {
          toast.error(sonuc.mesaj ?? "İşlem tamamlanamadı.");
          return;
        }
        toast.success(sonuc.mesaj ?? "Güncellendi.");
        setSecili([]);
        router.refresh();
      } catch {
        toast.error("İşlem tamamlanamadı. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
      }
    });
  }

  return (
    <>
      {secili.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-kart border border-kiremit/30 bg-kiremit-acik px-4 py-3">
          <span className="text-sm font-medium text-murekkep">
            <span className="rakam">{secili.length}</span> talep seçildi
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Secim
              value={topluDurum}
              onChange={(olay) => setTopluDurum(olay.target.value as TalepDurumu)}
              aria-label="Yeni durum"
              className="h-9 w-auto text-sm"
            >
              {TALEP_DURUM_LISTESI.map((durum) => (
                <option key={durum.deger} value={durum.deger}>
                  {durum.etiket}
                </option>
              ))}
            </Secim>
            <Buton
              type="button"
              gorunum="ikincil"
              boyut="kucuk"
              disabled={islemde}
              onClick={topluUygula}
            >
              Uygula
            </Buton>
            <Buton type="button" gorunum="sessiz" boyut="kucuk" onClick={() => setSecili([])}>
              Seçimi bırak
            </Buton>
          </div>
        </div>
      )}

      <div className="rounded-kart border border-cizgi bg-yuzey">
        <TabloSarmali>
          <thead>
            <tr className="border-b border-cizgi text-left text-xs uppercase tracking-wider text-solgun">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="size-4 accent-kiremit"
                  checked={hepsiSecili}
                  onChange={() => setSecili(hepsiSecili ? [] : talepler.map((talep) => talep.id))}
                  aria-label="Tümünü seç"
                />
              </th>
              <th className="px-4 py-3 font-medium">Kod</th>
              <th className="px-4 py-3 font-medium">Müşteri</th>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Tutar</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {talepler.map((talep) => (
              <tr
                key={talep.id}
                className={cn(
                  "border-b border-cizgi last:border-0 hover:bg-kum",
                  secili.includes(talep.id) && "bg-kiremit-acik/50",
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-kiremit"
                    checked={secili.includes(talep.id)}
                    onChange={() =>
                      setSecili((onceki) =>
                        onceki.includes(talep.id)
                          ? onceki.filter((kimlik) => kimlik !== talep.id)
                          : [...onceki, talep.id],
                      )
                    }
                    aria-label={`${talep.kod} seç`}
                  />
                </td>

                <td className="px-4 py-3">
                  <Link
                    href={`/admin/talepler/${talep.id}`}
                    className="rakam font-medium text-kiremit hover:underline"
                  >
                    {talep.kod}
                  </Link>
                </td>

                <td className="px-4 py-3">
                  <p className="font-medium text-murekkep">{talep.adSoyad}</p>
                  <p className="rakam text-xs text-solgun">{telefonBicimle(talep.telefon)}</p>
                </td>

                <td className="rakam px-4 py-3 text-murekkep-yumusak">{talep.kalemAdedi}</td>

                <td className="rakam px-4 py-3 text-murekkep">
                  {talep.toplamTutar ? fiyatBicimle(talep.toplamTutar) : "—"}
                </td>

                <td className="px-4 py-3">
                  <TalepDurumRozeti durum={talep.durum} />
                </td>

                <td className="rakam px-4 py-3 text-xs text-solgun">
                  {tarihSaatBicimle(talep.olusturmaTarihi)}
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/talepler/${talep.id}`}
                    aria-label={`${talep.kod} talebini aç`}
                    className="inline-flex rounded-yumusak p-2 text-murekkep-yumusak transition-colors hover:bg-kum-koyu hover:text-murekkep"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </TabloSarmali>
      </div>
    </>
  );
}
