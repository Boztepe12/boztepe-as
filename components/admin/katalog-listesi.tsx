"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Home, ImageOff, Pencil, Trash2 } from "lucide-react";

import { TabloSarmali } from "@/components/admin/panel-parcalari";
import { katalogDurumDegistir, kategoriSil, markaSil } from "@/lib/eylemler/admin/katalog";
import { cn } from "@/lib/utils";

export type KatalogSatiri = {
  id: number;
  ad: string;
  slug: string;
  gorselUrl: string | null;
  sira: number;
  aktif: boolean;
  urunAdedi: number;
  /* Kategoriye özel alanlar */
  ustKategoriId?: number | null;
  anaSayfadaGoster?: boolean;
  altMi?: boolean;
};

export function KatalogListesi({
  tur,
  satirlar,
}: {
  tur: "kategori" | "marka";
  satirlar: KatalogSatiri[];
}) {
  const router = useRouter();
  const [islemde, basla] = useTransition();

  const kategoriMi = tur === "kategori";
  const duzenleYolu = kategoriMi ? "/admin/kategoriler" : "/admin/markalar";

  function calistir(is: () => Promise<{ durum: string; mesaj?: string }>) {
    basla(async () => {
      try {
        const sonuc = await is();
        if (sonuc.durum === "hata") {
          /* Silme kuralları (bağlı ürün, alt kategori) buradan geliyor; mesaj uzun
             olabildiği için bildirimin süresini uzatıyoruz. */
          toast.error(sonuc.mesaj ?? "İşlem tamamlanamadı.", { duration: 6000 });
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
    <div className="rounded-kart border border-cizgi bg-yuzey">
      <TabloSarmali>
        <thead>
          <tr className="border-b border-cizgi text-left text-xs uppercase tracking-wider text-solgun">
            <th className="px-4 py-3 font-medium">{kategoriMi ? "Kategori" : "Marka"}</th>
            <th className="px-4 py-3 font-medium">Adres</th>
            <th className="px-4 py-3 font-medium">Ürün</th>
            <th className="px-4 py-3 font-medium">Sıra</th>
            <th className="px-4 py-3 font-medium">Yayın</th>
            <th className="w-24 px-4 py-3 text-right font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {satirlar.map((satir) => (
            <tr key={satir.id} className="border-b border-cizgi last:border-0 hover:bg-kum">
              <td className="px-4 py-3">
                <div className={cn("flex items-center gap-3", satir.altMi && "pl-6")}>
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-yumusak border border-cizgi bg-kum">
                    {satir.gorselUrl ? (
                      <Image
                        src={satir.gorselUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    ) : (
                      <ImageOff className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-solgun" />
                    )}
                  </div>
                  <Link
                    href={`${duzenleYolu}/${satir.id}`}
                    className="font-medium text-murekkep hover:text-kiremit"
                  >
                    {satir.ad}
                  </Link>
                </div>
              </td>

              <td className="px-4 py-3 text-sm text-solgun">{satir.slug}</td>

              <td className="rakam px-4 py-3 text-murekkep-yumusak">{satir.urunAdedi}</td>

              <td className="rakam px-4 py-3 text-murekkep-yumusak">{satir.sira}</td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={satir.aktif}
                    aria-label={`${satir.ad} yayın durumu`}
                    disabled={islemde}
                    onClick={() =>
                      calistir(() => katalogDurumDegistir(tur, satir.id, "aktif", !satir.aktif))
                    }
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                      satir.aktif ? "bg-onay" : "bg-cizgi-koyu",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all",
                        satir.aktif ? "left-[1.375rem]" : "left-0.5",
                      )}
                    />
                  </button>

                  {kategoriMi && (
                    <button
                      type="button"
                      disabled={islemde}
                      onClick={() =>
                        calistir(() =>
                          katalogDurumDegistir(
                            tur,
                            satir.id,
                            "anaSayfadaGoster",
                            !satir.anaSayfadaGoster,
                          ),
                        )
                      }
                      title={
                        satir.anaSayfadaGoster ? "Ana sayfada gösteriliyor" : "Ana sayfada göster"
                      }
                      aria-label={
                        satir.anaSayfadaGoster
                          ? "Ana sayfadan kaldır"
                          : "Ana sayfada göster"
                      }
                      aria-pressed={satir.anaSayfadaGoster}
                      className="rounded-yumusak p-1.5 transition-colors hover:bg-kum-koyu disabled:opacity-50"
                    >
                      <Home
                        className={cn(
                          "size-4",
                          satir.anaSayfadaGoster ? "text-kiremit" : "text-solgun",
                        )}
                      />
                    </button>
                  )}
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`${duzenleYolu}/${satir.id}`}
                    aria-label={`${satir.ad} düzenle`}
                    className="rounded-yumusak p-2 text-murekkep-yumusak transition-colors hover:bg-kum-koyu hover:text-murekkep"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={islemde}
                    aria-label={`${satir.ad} sil`}
                    onClick={() => {
                      const onay = window.confirm(`"${satir.ad}" silinecek. Devam edilsin mi?`);
                      if (onay) {
                        calistir(() => (kategoriMi ? kategoriSil(satir.id) : markaSil(satir.id)));
                      }
                    }}
                    className="rounded-yumusak p-2 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TabloSarmali>
    </div>
  );
}
