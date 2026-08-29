"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";

type Sonuc = { durum: string; mesaj?: string };

/**
 * Tek görsellik alanlar için ortak bileşen — kategori görseli, marka logosu.
 * Yükleme ve kaldırma sunucu eylemleri dışarıdan geçiliyor; böylece aynı arayüz
 * farklı tablolar için yeniden yazılmıyor.
 */
export function TekilGorsel({
  id,
  gorselUrl,
  baslik,
  aciklama,
  yukle,
  kaldir,
  kare,
}: {
  id: number;
  gorselUrl: string | null;
  baslik: string;
  aciklama?: string;
  yukle: (id: number, veri: FormData) => Promise<Sonuc>;
  kaldir: (id: number) => Promise<Sonuc>;
  kare?: boolean;
}) {
  const router = useRouter();
  const dosyaGirdisi = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [islemde, basla] = useTransition();

  const mesgul = yukleniyor || islemde;

  async function dosyaSecildi(dosya: File) {
    setYukleniyor(true);
    try {
      const veri = new FormData();
      veri.append("dosya", dosya);
      const sonuc = await yukle(id, veri);

      if (sonuc.durum === "hata") toast.error(sonuc.mesaj ?? "Yüklenemedi.");
      else {
        toast.success(sonuc.mesaj ?? "Yüklendi.");
        router.refresh();
      }
    } catch {
      toast.error("Yüklenemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
    } finally {
      setYukleniyor(false);
      if (dosyaGirdisi.current) dosyaGirdisi.current.value = "";
    }
  }

  function kaldirilsin() {
    basla(async () => {
      try {
        const sonuc = await kaldir(id);
        if (sonuc.durum === "hata") {
          toast.error(sonuc.mesaj ?? "Kaldırılamadı.");
          return;
        }
        toast.success(sonuc.mesaj ?? "Kaldırıldı.");
        router.refresh();
      } catch {
        toast.error("İşlem tamamlanamadı. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
      }
    });
  }

  return (
    <Panel baslik={baslik} aciklama={aciklama}>
      <input
        ref={dosyaGirdisi}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        hidden
        onChange={(olay) => {
          const dosya = olay.target.files?.[0];
          if (dosya) void dosyaSecildi(dosya);
        }}
      />

      <div className="flex flex-wrap items-center gap-5 p-5">
        {gorselUrl ? (
          <div
            className={`relative w-40 shrink-0 overflow-hidden rounded-kart border border-cizgi bg-kum ${
              kare ? "aspect-square" : "aspect-4/3"
            }`}
          >
            <Image src={gorselUrl} alt="" fill sizes="160px" className="object-contain" />
          </div>
        ) : (
          <div
            className={`flex w-40 shrink-0 items-center justify-center rounded-kart border border-dashed border-cizgi-koyu bg-kum/60 ${
              kare ? "aspect-square" : "aspect-4/3"
            }`}
          >
            <ImagePlus className="size-7 text-solgun" />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Buton
            type="button"
            gorunum="ikincil"
            boyut="kucuk"
            disabled={mesgul}
            onClick={() => dosyaGirdisi.current?.click()}
          >
            <ImagePlus className="size-4" />
            {yukleniyor ? "Yükleniyor…" : gorselUrl ? "Değiştir" : "Görsel seç"}
          </Buton>

          {gorselUrl && (
            <Buton
              type="button"
              gorunum="sessiz"
              boyut="kucuk"
              disabled={mesgul}
              onClick={kaldirilsin}
              className="hover:bg-hata/10 hover:text-hata"
            >
              <Trash2 className="size-4" />
              Kaldır
            </Buton>
          )}
        </div>
      </div>
    </Panel>
  );
}
