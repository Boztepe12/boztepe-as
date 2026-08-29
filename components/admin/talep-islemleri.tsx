"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";

import {
  Panel,
  TALEP_DURUM_LISTESI,
  type TalepDurumu,
} from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { MetinKutusu } from "@/components/ui/form";
import { talepDurumGuncelle, talepNotuKaydet, talepSil } from "@/lib/eylemler/admin/talep";
import { cn } from "@/lib/utils";

export function TalepIslemleri({
  talepId,
  durum,
  not,
}: {
  talepId: number;
  durum: TalepDurumu;
  not: string | null;
}) {
  const router = useRouter();
  const [seciliDurum, setSeciliDurum] = useState<TalepDurumu>(durum);
  const [metin, setMetin] = useState(not ?? "");
  const [islemde, basla] = useTransition();

  function calistir(is: () => Promise<{ durum: string; mesaj?: string }>, sonrasinda?: () => void) {
    basla(async () => {
      try {
        const sonuc = await is();
        if (sonuc.durum === "hata") {
          toast.error(sonuc.mesaj ?? "İşlem tamamlanamadı.");
          return;
        }
        if (sonuc.mesaj) toast.success(sonuc.mesaj);
        sonrasinda?.();
        router.refresh();
      } catch {
        toast.error("İşlem tamamlanamadı. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
      }
    });
  }

  function durumSec(yeni: TalepDurumu) {
    if (yeni === seciliDurum) return;
    /* Beklemeyi kısaltmak için önce arayüzü güncelliyoruz; hata olursa sunucudan
       gelen tazeleme doğru değeri geri yazar. */
    setSeciliDurum(yeni);
    calistir(() => talepDurumGuncelle(talepId, yeni));
  }

  return (
    <div className="space-y-5">
      <Panel baslik="Durum" aciklama="Müşteriyle her temastan sonra güncelleyin.">
        <div className="flex flex-wrap gap-2 p-5">
          {TALEP_DURUM_LISTESI.map((secenek) => {
            const etkin = secenek.deger === seciliDurum;
            return (
              <button
                key={secenek.deger}
                type="button"
                disabled={islemde}
                onClick={() => durumSec(secenek.deger)}
                aria-pressed={etkin}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:opacity-60",
                  etkin
                    ? "border-kiremit bg-kiremit text-white"
                    : "border-cizgi-koyu bg-yuzey text-murekkep-yumusak hover:border-kiremit hover:text-kiremit",
                )}
              >
                {secenek.etiket}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel baslik="Yönetici notu" aciklama="Yalnızca panelde görünür, müşteriye gitmez.">
        <div className="space-y-3 p-5">
          <MetinKutusu
            value={metin}
            onChange={(olay) => setMetin(olay.target.value)}
            rows={4}
            placeholder="Örn. Cuma günü tekrar aranacak, montaj için adres alınacak."
            aria-label="Yönetici notu"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Buton
              type="button"
              gorunum="ikincil"
              boyut="kucuk"
              disabled={islemde}
              onClick={() => calistir(() => talepNotuKaydet(talepId, metin))}
            >
              <Save className="size-4" />
              Notu kaydet
            </Buton>

            <Buton
              type="button"
              gorunum="sessiz"
              boyut="kucuk"
              disabled={islemde}
              onClick={() => {
                const onay = window.confirm(
                  "Bu talep kalıcı olarak silinecek. Geçmiş kaybolur; vazgeçmek için " +
                    "durumu İptal yapmanız yeterli. Yine de silinsin mi?",
                );
                if (onay) {
                  calistir(
                    () => talepSil(talepId),
                    () => router.push("/admin/talepler"),
                  );
                }
              }}
              className="text-murekkep-yumusak hover:bg-hata/10 hover:text-hata"
            >
              <Trash2 className="size-4" />
              Talebi sil
            </Buton>
          </div>
        </div>
      </Panel>
    </div>
  );
}
