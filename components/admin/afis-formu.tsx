"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton, ButonBaglanti } from "@/components/ui/buton";
import { Alan, AlanIzgarasi, Girdi, Onay } from "@/components/ui/form";
import { afisKaydet } from "@/lib/eylemler/admin/icerik";

export type FormAfisi = {
  id: number;
  baslik: string;
  altBaslik: string | null;
  baglanti: string | null;
  butonMetni: string | null;
  sira: number;
  aktif: boolean;
  baslangicTarihi: Date | string | null;
  bitisTarihi: Date | string | null;
};

/** `<input type="date">` yalnızca "2026-09-01" biçimini kabul ediyor. */
function tarihGirdisi(tarih: Date | string | null): string {
  if (!tarih) return "";
  const deger = typeof tarih === "string" ? new Date(tarih) : tarih;
  if (Number.isNaN(deger.getTime())) return "";
  return deger.toISOString().slice(0, 10);
}

export function AfisFormu({ afis }: { afis?: FormAfisi }) {
  const router = useRouter();
  const [deger, setDeger] = useState({
    baslik: afis?.baslik ?? "",
    altBaslik: afis?.altBaslik ?? "",
    baglanti: afis?.baglanti ?? "",
    butonMetni: afis?.butonMetni ?? "",
    sira: String(afis?.sira ?? 0),
    aktif: afis?.aktif ?? true,
    baslangicTarihi: tarihGirdisi(afis?.baslangicTarihi ?? null),
    bitisTarihi: tarihGirdisi(afis?.bitisTarihi ?? null),
  });
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [kaydediliyor, basla] = useTransition();

  function guncelle<T extends keyof typeof deger>(alan: T, yeni: (typeof deger)[T]) {
    setDeger((onceki) => ({ ...onceki, [alan]: yeni }));
    if (hatalar[alan]) {
      setHatalar((onceki) => {
        const kalan = { ...onceki };
        delete kalan[alan as string];
        return kalan;
      });
    }
  }

  function kaydet() {
    basla(async () => {
      try {
        const sonuc = await afisKaydet({ id: afis?.id, ...deger });

        if (sonuc.durum === "hata") {
          setHatalar(sonuc.alanlar ?? {});
          toast.error(sonuc.mesaj);
          return;
        }

        setHatalar({});
        toast.success(sonuc.mesaj ?? "Kaydedildi.");

        if (afis) router.refresh();
        else if (sonuc.id) router.push(`/admin/afisler/${sonuc.id}`);
      } catch {
        toast.error("Kaydedilemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyip deneyin.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Panel baslik="Afiş metni">
        <div className="space-y-4 p-5">
          <Alan etiket="Başlık" zorunlu hata={hatalar.baslik}>
            <Girdi
              value={deger.baslik}
              onChange={(olay) => guncelle("baslik", olay.target.value)}
              placeholder="Örn. Yaz indirimi başladı"
              aria-invalid={Boolean(hatalar.baslik)}
              autoFocus={!afis}
            />
          </Alan>

          <Alan etiket="Alt başlık" hata={hatalar.altBaslik}>
            <Girdi
              value={deger.altBaslik}
              onChange={(olay) => guncelle("altBaslik", olay.target.value)}
              placeholder="Örn. Seçili beyaz eşyada %30'a varan indirim"
            />
          </Alan>

          <AlanIzgarasi>
            <Alan
              etiket="Bağlantı"
              ipucu="Afişe tıklayınca gidilecek adres. Örn. /kampanyalar"
              hata={hatalar.baglanti}
            >
              <Girdi
                value={deger.baglanti}
                onChange={(olay) => guncelle("baglanti", olay.target.value)}
                placeholder="/kampanyalar"
              />
            </Alan>

            <Alan etiket="Buton metni" ipucu="Boş bırakılırsa buton görünmez.">
              <Girdi
                value={deger.butonMetni}
                onChange={(olay) => guncelle("butonMetni", olay.target.value)}
                placeholder="İncele"
              />
            </Alan>
          </AlanIzgarasi>
        </div>
      </Panel>

      <Panel baslik="Yayın" aciklama="Tarih verirseniz afiş yalnızca o aralıkta görünür.">
        <div className="space-y-4 p-5">
          <AlanIzgarasi>
            <Alan etiket="Başlangıç tarihi" hata={hatalar.baslangicTarihi}>
              <Girdi
                type="date"
                value={deger.baslangicTarihi}
                onChange={(olay) => guncelle("baslangicTarihi", olay.target.value)}
                className="rakam"
              />
            </Alan>

            <Alan etiket="Bitiş tarihi" hata={hatalar.bitisTarihi}>
              <Girdi
                type="date"
                value={deger.bitisTarihi}
                onChange={(olay) => guncelle("bitisTarihi", olay.target.value)}
                className="rakam"
              />
            </Alan>
          </AlanIzgarasi>

          <Alan etiket="Sıra" ipucu="Küçük sayı önce gösterilir." className="sm:max-w-[12rem]">
            <Girdi
              value={deger.sira}
              onChange={(olay) => guncelle("sira", olay.target.value)}
              inputMode="numeric"
              className="rakam"
            />
          </Alan>

          <Onay
            checked={deger.aktif}
            onChange={(olay) => guncelle("aktif", olay.target.checked)}
            etiket="Ana sayfada yayında"
          />
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ButonBaglanti href="/admin/afisler" gorunum="sessiz">
          Vazgeç
        </ButonBaglanti>
        <Buton type="button" onClick={kaydet} disabled={kaydediliyor}>
          <Save className="size-4" />
          {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
        </Buton>
      </div>
    </div>
  );
}
