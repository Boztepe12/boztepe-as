"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { urunGorseliSil, urunGorseliTasi, urunGorseliYukle } from "@/lib/eylemler/admin/urun";
import { cn } from "@/lib/utils";

export type YonetilenGorsel = {
  id: number;
  url: string;
  altMetin: string | null;
};

export function GorselYonetimi({
  urunId,
  gorseller,
  cloudinaryHazir,
}: {
  urunId: number;
  gorseller: YonetilenGorsel[];
  cloudinaryHazir: boolean;
}) {
  const router = useRouter();
  const dosyaGirdisi = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [islemde, basla] = useTransition();

  async function dosyalariYukle(dosyalar: FileList) {
    setYukleniyor(true);

    /*
     * Dosyalar tek tek gönderiliyor. Aynı anda göndermek sıra numaralarını
     * yarıştırır ve kapak görselinin hangisi olacağı öngörülemez hâle gelir.
     */
    let basarili = 0;
    for (const dosya of Array.from(dosyalar)) {
      const veri = new FormData();
      veri.append("dosya", dosya);

      try {
        const sonuc = await urunGorseliYukle(urunId, veri);
        if (sonuc.durum === "hata") {
          toast.error(`${dosya.name}: ${sonuc.mesaj}`);
          continue;
        }
        basarili += 1;
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
        router.refresh();
      } catch {
        toast.error("İşlem tamamlanamadı. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
      }
    });
  }

  const mesgul = yukleniyor || islemde;

  return (
    <Panel
      baslik="Fotoğraflar"
      aciklama="Fotoğraf işlemleri anında kaydedilir. İlk sıradaki fotoğraf kapak olur."
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
            <span className="font-medium text-murekkep">Fotoğraf ekleyin</span>
            <span className="mt-1 text-sm text-murekkep-yumusak">
              JPG, PNG veya WEBP · en fazla 8 MB
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gorseller.map((gorsel, sira) => (
              <figure
                key={gorsel.id}
                className={cn(
                  "overflow-hidden rounded-kart border bg-kum",
                  sira === 0 ? "border-kiremit" : "border-cizgi",
                )}
              >
                <div className="relative aspect-square">
                  <Image
                    src={gorsel.url}
                    alt={gorsel.altMetin ?? ""}
                    fill
                    sizes="(min-width: 1024px) 20vw, 45vw"
                    className="object-cover"
                  />
                  {sira === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-kiremit px-2 py-0.5 text-xs font-medium text-white">
                      Kapak
                    </span>
                  )}
                </div>

                <figcaption className="flex items-center justify-between gap-1 border-t border-cizgi bg-yuzey px-2 py-1.5">
                  <div className="flex gap-0.5">
                    <IslemDugmesi
                      etiket={`${sira + 1}. fotoğrafı öne al`}
                      pasif={sira === 0 || mesgul}
                      onTikla={() => calistir(() => urunGorseliTasi(gorsel.id, "yukari"))}
                    >
                      <ArrowLeft className="size-4" />
                    </IslemDugmesi>
                    <IslemDugmesi
                      etiket={`${sira + 1}. fotoğrafı geri al`}
                      pasif={sira === gorseller.length - 1 || mesgul}
                      onTikla={() => calistir(() => urunGorseliTasi(gorsel.id, "asagi"))}
                    >
                      <ArrowRight className="size-4" />
                    </IslemDugmesi>
                  </div>

                  <IslemDugmesi
                    etiket={`${sira + 1}. fotoğrafı sil`}
                    pasif={mesgul}
                    tehlike
                    onTikla={() => {
                      const onay = window.confirm("Bu fotoğraf silinecek. Devam edilsin mi?");
                      if (onay) calistir(() => urunGorseliSil(gorsel.id));
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IslemDugmesi>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {!cloudinaryHazir && (
          <p className="mt-4 rounded-yumusak border border-uyari/30 bg-uyari/8 px-3.5 py-2.5 text-sm text-murekkep-yumusak">
            Cloudinary anahtarları tanımlı olmadığı için fotoğraflar bu bilgisayarda{" "}
            <code className="rakam">public/yuklenenler</code> klasörüne kaydediliyor. Site
            yayına alınmadan önce anahtarların girilmesi gerekiyor.
          </p>
        )}
      </div>
    </Panel>
  );
}

function IslemDugmesi({
  etiket,
  pasif,
  tehlike,
  onTikla,
  children,
}: {
  etiket: string;
  pasif: boolean;
  tehlike?: boolean;
  onTikla: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={etiket}
      title={etiket}
      disabled={pasif}
      onClick={onTikla}
      className={cn(
        "rounded-yumusak p-1.5 text-murekkep-yumusak transition-colors disabled:opacity-40",
        tehlike
          ? "hover:bg-hata/10 hover:text-hata"
          : "hover:bg-kum-koyu hover:text-murekkep",
      )}
    >
      {children}
    </button>
  );
}
