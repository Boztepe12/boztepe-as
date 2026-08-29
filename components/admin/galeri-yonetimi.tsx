"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Save, Trash2 } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { Girdi, Onay } from "@/components/ui/form";
import {
  galeriGorseliGuncelle,
  galeriGorseliSil,
  galeriGorseliTasi,
  galeriGorseliYukle,
} from "@/lib/eylemler/admin/icerik";
import { cn } from "@/lib/utils";

export type GaleriKaydi = {
  id: number;
  baslik: string | null;
  url: string;
  aktif: boolean;
};

export function GaleriYonetimi({ gorseller }: { gorseller: GaleriKaydi[] }) {
  const router = useRouter();
  const dosyaGirdisi = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [islemde, basla] = useTransition();

  /* Başlık kutuları kaydedilene kadar yerelde tutuluyor. */
  const [basliklar, setBasliklar] = useState<Record<number, string>>({});

  const mesgul = yukleniyor || islemde;

  async function dosyalariYukle(dosyalar: FileList) {
    setYukleniyor(true);
    let basarili = 0;

    for (const dosya of Array.from(dosyalar)) {
      try {
        const veri = new FormData();
        veri.append("dosya", dosya);
        const sonuc = await galeriGorseliYukle(veri);

        if (sonuc.durum === "hata") toast.error(`${dosya.name}: ${sonuc.mesaj}`);
        else basarili += 1;
      } catch {
        toast.error(`${dosya.name} yüklenemedi. Bağlantınızı ve oturumunuzu kontrol edin.`);
      }
    }

    setYukleniyor(false);
    if (dosyaGirdisi.current) dosyaGirdisi.current.value = "";

    if (basarili > 0) {
      toast.success(basarili === 1 ? "Görsel yüklendi." : `${basarili} görsel yüklendi.`);
      router.refresh();
    }
  }

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
    <Panel
      baslik="Galeri görselleri"
      aciklama="Mağaza fotoğrafları galeri sayfasında bu sırayla görünür."
      eylem={
        <Buton
          type="button"
          gorunum="ikincil"
          boyut="kucuk"
          disabled={mesgul}
          onClick={() => dosyaGirdisi.current?.click()}
        >
          <ImagePlus className="size-4" />
          {yukleniyor ? "Yükleniyor…" : "Fotoğraf ekle"}
        </Buton>
      }
    >
      <input
        ref={dosyaGirdisi}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        hidden
        onChange={(olay) => {
          const dosyalar = olay.target.files;
          if (dosyalar && dosyalar.length > 0) void dosyalariYukle(dosyalar);
        }}
      />

      <div className="p-5">
        {gorseller.length === 0 ? (
          <button
            type="button"
            disabled={mesgul}
            onClick={() => dosyaGirdisi.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-kart border border-dashed border-cizgi-koyu bg-kum/60 px-6 py-12 text-center transition-colors hover:border-kiremit hover:bg-kiremit-acik/40"
          >
            <ImagePlus className="mb-3 size-8 text-solgun" />
            <span className="font-medium text-murekkep">Mağaza fotoğrafı ekleyin</span>
            <span className="mt-1 text-sm text-murekkep-yumusak">
              JPG, PNG veya WEBP · en fazla 8 MB
            </span>
          </button>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gorseller.map((gorsel, sira) => {
              const baslik = basliklar[gorsel.id] ?? gorsel.baslik ?? "";
              const degisti = baslik !== (gorsel.baslik ?? "");

              return (
                <div
                  key={gorsel.id}
                  className={cn(
                    "overflow-hidden rounded-kart border bg-yuzey",
                    gorsel.aktif ? "border-cizgi" : "border-dashed border-cizgi-koyu opacity-70",
                  )}
                >
                  <div className="relative aspect-4/3 bg-kum">
                    <Image
                      src={gorsel.url}
                      alt={gorsel.baslik ?? ""}
                      fill
                      sizes="(min-width: 1024px) 30vw, 45vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-3 p-3">
                    <Girdi
                      value={baslik}
                      onChange={(olay) =>
                        setBasliklar((onceki) => ({ ...onceki, [gorsel.id]: olay.target.value }))
                      }
                      placeholder="Başlık (isteğe bağlı)"
                      aria-label={`${sira + 1}. görselin başlığı`}
                      className="h-9 text-sm"
                    />

                    <div className="flex items-center justify-between gap-2">
                      <Onay
                        checked={gorsel.aktif}
                        disabled={mesgul}
                        onChange={(olay) =>
                          calistir(() =>
                            galeriGorseliGuncelle(gorsel.id, baslik, olay.target.checked),
                          )
                        }
                        etiket={<span className="text-xs">Yayında</span>}
                      />

                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          aria-label={`${sira + 1}. görseli öne al`}
                          disabled={sira === 0 || mesgul}
                          onClick={() => calistir(() => galeriGorseliTasi(gorsel.id, "yukari"))}
                          className="rounded-yumusak p-1.5 text-murekkep-yumusak transition-colors hover:bg-kum-koyu disabled:opacity-40"
                        >
                          <ArrowLeft className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${sira + 1}. görseli geri al`}
                          disabled={sira === gorseller.length - 1 || mesgul}
                          onClick={() => calistir(() => galeriGorseliTasi(gorsel.id, "asagi"))}
                          className="rounded-yumusak p-1.5 text-murekkep-yumusak transition-colors hover:bg-kum-koyu disabled:opacity-40"
                        >
                          <ArrowRight className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${sira + 1}. görseli sil`}
                          disabled={mesgul}
                          onClick={() => {
                            const onay = window.confirm(
                              "Bu fotoğraf silinecek. Devam edilsin mi?",
                            );
                            if (onay) calistir(() => galeriGorseliSil(gorsel.id));
                          }}
                          className="rounded-yumusak p-1.5 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata disabled:opacity-40"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    {degisti && (
                      <Buton
                        type="button"
                        gorunum="ikincil"
                        boyut="kucuk"
                        tamGenislik
                        disabled={mesgul}
                        onClick={() =>
                          calistir(() => galeriGorseliGuncelle(gorsel.id, baslik, gorsel.aktif))
                        }
                      >
                        <Save className="size-4" />
                        Başlığı kaydet
                      </Buton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}
