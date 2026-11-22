"use client";

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { cn } from "@/lib/utils";

type Sonuc = { durum: string; mesaj?: string };

const KABUL = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/**
 * Yeni kayıt ekranında, kayıt henüz yokken seçilen fotoğraflar. Dosyalar
 * tarayıcıda bekler; form kaydedilip kimlik gelince `bekleyenleriYukle` ile
 * sırayla depoya gönderilir. Düzenleme ekranındaki `GorselYonetimi` /
 * `TekilGorsel` ile aynı görünür, ama hiçbir şeyi anında kaydetmez.
 */
export function BekleyenGorseller({
  baslik,
  aciklama,
  dosyalar,
  degisti,
  coklu = false,
  kare = false,
  pasif = false,
}: {
  baslik: string;
  aciklama?: string;
  dosyalar: File[];
  degisti: (dosyalar: File[]) => void;
  /** Ürün gibi birden çok fotoğraf alan kayıtlar; ilk sıradaki kapak olur. */
  coklu?: boolean;
  kare?: boolean;
  pasif?: boolean;
}) {
  const girdi = useRef<HTMLInputElement>(null);

  /* Önizleme adresleri dosyalar değiştikçe yeniden üretilir, eskiler bırakılır. */
  const onizlemeler = useMemo(() => dosyalar.map((dosya) => URL.createObjectURL(dosya)), [dosyalar]);
  useEffect(() => () => onizlemeler.forEach((adres) => URL.revokeObjectURL(adres)), [onizlemeler]);

  function eklendi(secilen: FileList) {
    const yeni = Array.from(secilen);
    degisti(coklu ? [...dosyalar, ...yeni] : yeni.slice(0, 1));
    if (girdi.current) girdi.current.value = "";
  }

  function tasi(sira: number, yon: -1 | 1) {
    const kopya = [...dosyalar];
    [kopya[sira], kopya[sira + yon]] = [kopya[sira + yon], kopya[sira]];
    degisti(kopya);
  }

  const sec = () => girdi.current?.click();
  const oran = kare ? "aspect-square" : coklu ? "aspect-square" : "aspect-4/3";

  return (
    <Panel
      baslik={baslik}
      aciklama={aciklama ?? "Seçtiğiniz fotoğraflar kaydet'e bastığınızda yüklenir."}
      eylem={
        coklu && dosyalar.length > 0 ? (
          <Buton type="button" gorunum="ikincil" boyut="kucuk" disabled={pasif} onClick={sec}>
            <ImagePlus className="size-4" />
            Fotoğraf ekle
          </Buton>
        ) : undefined
      }
    >
      <input
        ref={girdi}
        type="file"
        accept={KABUL}
        multiple={coklu}
        hidden
        onChange={(olay) => {
          if (olay.target.files?.length) eklendi(olay.target.files);
        }}
      />

      <div className="p-5">
        {coklu ? (
          dosyalar.length === 0 ? (
            <button
              type="button"
              disabled={pasif}
              onClick={sec}
              className="flex w-full flex-col items-center justify-center rounded-kart border border-dashed border-cizgi-koyu bg-kum/60 px-6 py-12 text-center transition-colors hover:border-kiremit hover:bg-kiremit-acik/40"
            >
              <ImagePlus className="mb-3 size-8 text-solgun" />
              <span className="font-medium text-murekkep">Fotoğraf ekleyin</span>
              <span className="mt-1 text-sm text-murekkep-yumusak">JPG, PNG veya WEBP · en fazla 8 MB</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {dosyalar.map((dosya, sira) => (
                <figure
                  key={`${dosya.name}-${dosya.lastModified}-${sira}`}
                  className={cn(
                    "overflow-hidden rounded-kart border bg-kum",
                    sira === 0 ? "border-kiremit" : "border-cizgi",
                  )}
                >
                  <div className={cn("relative", oran)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- yerel önizleme (blob:), next/image işleyemez */}
                    <img src={onizlemeler[sira]} alt="" className="absolute inset-0 size-full object-cover" />
                    {sira === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-kiremit px-2 py-0.5 text-xs font-medium text-white">
                        Kapak
                      </span>
                    )}
                  </div>
                  <figcaption className="flex items-center justify-between gap-1 border-t border-cizgi bg-yuzey px-2 py-1.5">
                    <div className="flex gap-0.5">
                      <Dugme etiket={`${sira + 1}. fotoğrafı öne al`} pasif={pasif || sira === 0} onTikla={() => tasi(sira, -1)}>
                        <ArrowLeft className="size-4" />
                      </Dugme>
                      <Dugme
                        etiket={`${sira + 1}. fotoğrafı geri al`}
                        pasif={pasif || sira === dosyalar.length - 1}
                        onTikla={() => tasi(sira, 1)}
                      >
                        <ArrowRight className="size-4" />
                      </Dugme>
                    </div>
                    <Dugme
                      etiket={`${sira + 1}. fotoğrafı çıkar`}
                      pasif={pasif}
                      tehlike
                      onTikla={() => degisti(dosyalar.filter((_, i) => i !== sira))}
                    >
                      <Trash2 className="size-4" />
                    </Dugme>
                  </figcaption>
                </figure>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            <div
              className={cn(
                "relative flex w-40 shrink-0 items-center justify-center overflow-hidden rounded-kart border bg-kum",
                oran,
                dosyalar[0] ? "border-cizgi" : "border-dashed border-cizgi-koyu bg-kum/60",
              )}
            >
              {dosyalar[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- yerel önizleme (blob:)
                <img src={onizlemeler[0]} alt="" className="absolute inset-0 size-full object-contain" />
              ) : (
                <ImagePlus className="size-7 text-solgun" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Buton type="button" gorunum="ikincil" boyut="kucuk" disabled={pasif} onClick={sec}>
                <ImagePlus className="size-4" />
                {dosyalar[0] ? "Değiştir" : "Görsel seç"}
              </Buton>
              {dosyalar[0] && (
                <Buton
                  type="button"
                  gorunum="sessiz"
                  boyut="kucuk"
                  disabled={pasif}
                  onClick={() => degisti([])}
                  className="hover:bg-hata/10 hover:text-hata"
                >
                  <Trash2 className="size-4" />
                  Kaldır
                </Buton>
              )}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

/**
 * Bekleyen dosyaları yeni kaydın kimliğiyle sırayla yükler (aynı anda değil:
 * sıra numaraları yarışmasın, kapak ilk seçilen olsun). Kayıt zaten oluştuğu
 * için bir dosya yüklenemezse ötekiler yine denenir; yüklenemeyenlerin sayısı döner.
 */
export async function bekleyenleriYukle(
  id: number,
  dosyalar: File[],
  yukle: (id: number, veri: FormData) => Promise<Sonuc>,
): Promise<number> {
  let basarisiz = 0;
  for (const dosya of dosyalar) {
    const veri = new FormData();
    veri.append("dosya", dosya);
    try {
      const sonuc = await yukle(id, veri);
      if (sonuc.durum === "hata") {
        basarisiz += 1;
        toast.error(`${dosya.name}: ${sonuc.mesaj ?? "yüklenemedi."}`);
      }
    } catch {
      basarisiz += 1;
      toast.error(`${dosya.name} yüklenemedi. Bağlantınızı ve oturumunuzu kontrol edin.`);
    }
  }
  return basarisiz;
}

function Dugme({
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
        "rounded-yumusak p-2 text-murekkep-yumusak transition-colors disabled:opacity-40 md:p-1.5",
        tehlike ? "hover:bg-hata/10 hover:text-hata" : "hover:bg-kum-koyu hover:text-murekkep",
      )}
    >
      {children}
    </button>
  );
}
