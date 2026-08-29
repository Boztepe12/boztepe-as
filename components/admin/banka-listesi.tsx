"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, X } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { Alan, AlanIzgarasi, Girdi, Onay } from "@/components/ui/form";
import { bankaHesabiKaydet, bankaHesabiSil } from "@/lib/eylemler/admin/icerik";
import { cn, ibanBicimle } from "@/lib/utils";

export type BankaKaydi = {
  id: number;
  bankaAdi: string;
  hesapSahibi: string;
  iban: string;
  sube: string | null;
  sira: number;
  aktif: boolean;
};

type FormDegeri = {
  bankaAdi: string;
  hesapSahibi: string;
  iban: string;
  sube: string;
  sira: string;
  aktif: boolean;
};

function bosForm(varsayilanSahip: string): FormDegeri {
  return {
    bankaAdi: "",
    hesapSahibi: varsayilanSahip,
    iban: "TR",
    sube: "",
    sira: "0",
    aktif: true,
  };
}

export function BankaListesi({
  hesaplar,
  varsayilanSahip,
}: {
  hesaplar: BankaKaydi[];
  /** Yeni hesap eklerken hesap sahibi alanı firma adıyla dolu gelsin. */
  varsayilanSahip: string;
}) {
  const router = useRouter();
  const [duzenlenen, setDuzenlenen] = useState<number | "yeni" | null>(null);
  const [deger, setDeger] = useState<FormDegeri>(bosForm(varsayilanSahip));
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [islemde, basla] = useTransition();

  function duzenlemeyeAc(hesap: BankaKaydi) {
    setDuzenlenen(hesap.id);
    setHatalar({});
    setDeger({
      bankaAdi: hesap.bankaAdi,
      hesapSahibi: hesap.hesapSahibi,
      iban: hesap.iban,
      sube: hesap.sube ?? "",
      sira: String(hesap.sira),
      aktif: hesap.aktif,
    });
  }

  function kapat() {
    setDuzenlenen(null);
    setHatalar({});
    setDeger(bosForm(varsayilanSahip));
  }

  function kaydet() {
    basla(async () => {
      try {
        const sonuc = await bankaHesabiKaydet({
          id: duzenlenen === "yeni" ? undefined : duzenlenen ?? undefined,
          ...deger,
        });

        if (sonuc.durum === "hata") {
          setHatalar(sonuc.alanlar ?? {});
          toast.error(sonuc.mesaj);
          return;
        }

        toast.success(sonuc.mesaj ?? "Kaydedildi.");
        kapat();
        router.refresh();
      } catch {
        toast.error("Kaydedilemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyip deneyin.");
      }
    });
  }

  function sil(hesap: BankaKaydi) {
    const onay = window.confirm(`${hesap.bankaAdi} hesabı silinecek. Devam edilsin mi?`);
    if (!onay) return;

    basla(async () => {
      try {
        const sonuc = await bankaHesabiSil(hesap.id);
        if (sonuc.durum === "hata") {
          toast.error(sonuc.mesaj ?? "Silinemedi.");
          return;
        }
        toast.success(sonuc.mesaj ?? "Silindi.");
        router.refresh();
      } catch {
        toast.error("İşlem tamamlanamadı. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
      }
    });
  }

  const form = (
    <div className="space-y-4 border-t border-cizgi bg-kum/60 p-5">
      <AlanIzgarasi>
        <Alan etiket="Banka" zorunlu hata={hatalar.bankaAdi}>
          <Girdi
            value={deger.bankaAdi}
            onChange={(olay) => setDeger((o) => ({ ...o, bankaAdi: olay.target.value }))}
            placeholder="Örn. Ziraat Bankası"
            aria-invalid={Boolean(hatalar.bankaAdi)}
            autoFocus
          />
        </Alan>

        <Alan etiket="Şube" hata={hatalar.sube}>
          <Girdi
            value={deger.sube}
            onChange={(olay) => setDeger((o) => ({ ...o, sube: olay.target.value }))}
            placeholder="Örn. Malatya Merkez"
          />
        </Alan>
      </AlanIzgarasi>

      <Alan etiket="Hesap sahibi" zorunlu hata={hatalar.hesapSahibi}>
        <Girdi
          value={deger.hesapSahibi}
          onChange={(olay) => setDeger((o) => ({ ...o, hesapSahibi: olay.target.value }))}
          aria-invalid={Boolean(hatalar.hesapSahibi)}
        />
      </Alan>

      <Alan
        etiket="IBAN"
        zorunlu
        ipucu="Boşluklu ya da boşluksuz yazabilirsiniz; site düzenli gösterir."
        hata={hatalar.iban}
      >
        <Girdi
          value={deger.iban}
          onChange={(olay) => setDeger((o) => ({ ...o, iban: olay.target.value.toUpperCase() }))}
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          className="rakam"
          aria-invalid={Boolean(hatalar.iban)}
        />
      </Alan>

      <AlanIzgarasi>
        <Alan etiket="Sıra" ipucu="Küçük sayı önce görünür.">
          <Girdi
            value={deger.sira}
            onChange={(olay) => setDeger((o) => ({ ...o, sira: olay.target.value }))}
            inputMode="numeric"
            className="rakam"
          />
        </Alan>

        <div className="flex items-end pb-2.5">
          <Onay
            checked={deger.aktif}
            onChange={(olay) => setDeger((o) => ({ ...o, aktif: olay.target.checked }))}
            etiket="Sitede göster"
          />
        </div>
      </AlanIzgarasi>

      <div className="flex flex-wrap justify-end gap-2">
        <Buton type="button" gorunum="sessiz" boyut="kucuk" onClick={kapat} disabled={islemde}>
          <X className="size-4" />
          Vazgeç
        </Buton>
        <Buton type="button" boyut="kucuk" onClick={kaydet} disabled={islemde}>
          <Save className="size-4" />
          {islemde ? "Kaydediliyor…" : "Kaydet"}
        </Buton>
      </div>
    </div>
  );

  return (
    <Panel
      baslik="Banka hesapları"
      aciklama="Site altbilgisinde ve iletişim sayfasında listelenir."
      eylem={
        duzenlenen === "yeni" ? undefined : (
          <Buton
            type="button"
            gorunum="ikincil"
            boyut="kucuk"
            onClick={() => {
              setDuzenlenen("yeni");
              setHatalar({});
              setDeger(bosForm(varsayilanSahip));
            }}
          >
            <Plus className="size-4" />
            Yeni hesap
          </Buton>
        )
      }
    >
      {duzenlenen === "yeni" && form}

      {hesaplar.length === 0 && duzenlenen !== "yeni" ? (
        <p className="px-5 py-10 text-center text-sm text-murekkep-yumusak">
          Henüz banka hesabı eklenmemiş.
        </p>
      ) : (
        <ul>
          {hesaplar.map((hesap) => (
            <li key={hesap.id} className="border-t border-cizgi first:border-t-0">
              <div
                className={cn(
                  "flex flex-wrap items-center gap-4 px-5 py-4",
                  !hesap.aktif && "opacity-60",
                )}
              >
                <div className="min-w-48 flex-1">
                  <p className="font-medium text-murekkep">
                    {hesap.bankaAdi}
                    {hesap.sube && (
                      <span className="ml-2 text-sm font-normal text-solgun">{hesap.sube}</span>
                    )}
                    {!hesap.aktif && (
                      <span className="ml-2 text-xs font-normal text-solgun">(gizli)</span>
                    )}
                  </p>
                  <p className="rakam mt-0.5 text-sm text-murekkep-yumusak">
                    {ibanBicimle(hesap.iban)}
                  </p>
                  <p className="text-xs text-solgun">{hesap.hesapSahibi}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Buton
                    type="button"
                    gorunum="sessiz"
                    boyut="kucuk"
                    disabled={islemde}
                    onClick={() => duzenlemeyeAc(hesap)}
                  >
                    Düzenle
                  </Buton>
                  <button
                    type="button"
                    aria-label={`${hesap.bankaAdi} hesabını sil`}
                    disabled={islemde}
                    onClick={() => sil(hesap)}
                    className="rounded-yumusak p-2 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {duzenlenen === hesap.id && form}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
