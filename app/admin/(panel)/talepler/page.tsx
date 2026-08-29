import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";

import {
  SayfaBasligi,
  TALEP_DURUM_LISTESI,
  type TalepDurumu,
} from "@/components/admin/panel-parcalari";
import { PanelSayfalama } from "@/components/admin/panel-sayfalama";
import { TalepListesi, type ListeTalebi } from "@/components/admin/talep-listesi";
import { BosDurum } from "@/components/ui/durum";
import { yoneticiTalepleri } from "@/lib/sorgular/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Talepler" };

type Parametreler = Record<string, string | string[] | undefined>;

function tek(deger: string | string[] | undefined): string {
  if (Array.isArray(deger)) return deger[0] ?? "";
  return deger ?? "";
}

export default async function TaleplerSayfasi({
  searchParams,
}: {
  searchParams: Promise<Parametreler>;
}) {
  const parametreler = await searchParams;
  const durum = tek(parametreler.durum);
  const sayfa = Number(tek(parametreler.sayfa)) || 1;

  const sonuc = await yoneticiTalepleri(durum || undefined, sayfa);

  const toplamHepsi = Object.values(sonuc.sayimlar).reduce((toplam, adet) => toplam + adet, 0);

  const sekmeler = [
    { deger: "", etiket: "Tümü", adet: toplamHepsi },
    ...TALEP_DURUM_LISTESI.map((secenek) => ({
      deger: secenek.deger as string,
      etiket: secenek.etiket,
      adet: sonuc.sayimlar[secenek.deger] ?? 0,
    })),
  ];

  return (
    <>
      <SayfaBasligi
        baslik="Talepler"
        aciklama="Siteden gelen teklif ve sipariş talepleri. Müşteriyi aradıkça durumu güncelleyin."
      />

      {/* Durum sekmeleri — panelin en sık kullanılan filtresi olduğu için üstte duruyor. */}
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Duruma göre filtrele">
        {sekmeler.map((sekme) => {
          const etkin = durum === sekme.deger;
          return (
            <Link
              key={sekme.deger || "hepsi"}
              href={sekme.deger ? `/admin/talepler?durum=${sekme.deger}` : "/admin/talepler"}
              aria-current={etkin ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                etkin
                  ? "border-kiremit bg-kiremit text-white"
                  : "border-cizgi-koyu bg-yuzey text-murekkep-yumusak hover:border-kiremit hover:text-kiremit",
              )}
            >
              {sekme.etiket}
              <span
                className={cn(
                  "rakam rounded-full px-1.5 text-xs",
                  etkin ? "bg-white/25" : "bg-kum-koyu",
                )}
              >
                {sekme.adet}
              </span>
            </Link>
          );
        })}
      </nav>

      {sonuc.talepler.length === 0 ? (
        <BosDurum
          simge={<Inbox className="size-10" />}
          baslik={durum ? "Bu durumda talep yok" : "Henüz talep gelmedi"}
          aciklama={
            durum
              ? "Başka bir durumu seçerek diğer talepleri görebilirsiniz."
              : "Müşteriler teklif sepetinden talep gönderdiğinde burada listelenir."
          }
        />
      ) : (
        <>
          <TalepListesi
            talepler={sonuc.talepler.map((talep) => ({
              ...talep,
              durum: talep.durum as TalepDurumu,
            })) as ListeTalebi[]}
          />
          <PanelSayfalama
            yol="/admin/talepler"
            sayfa={sonuc.sayfa}
            sayfaSayisi={sonuc.sayfaSayisi}
            sorgu={{ durum: durum || undefined }}
          />
        </>
      )}
    </>
  );
}
