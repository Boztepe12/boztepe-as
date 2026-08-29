"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ImageOff, Pencil, Star, Trash2 } from "lucide-react";

import { TabloSarmali } from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { Rozet, StokRozeti } from "@/components/ui/rozet";
import { urunDurumDegistir, urunSil, urunlerToplu } from "@/lib/eylemler/admin/urun";
import { cn, fiyatBicimle, indirimYuzdesi, tarihSaatBicimle } from "@/lib/utils";

export type ListeUrunu = {
  id: number;
  ad: string;
  slug: string;
  stokKodu: string | null;
  fiyat: string | null;
  indirimliFiyat: string | null;
  fiyatGizli: boolean;
  stokDurumu: "stokta" | "tukendi" | "siparise_bagli";
  aktif: boolean;
  oneCikan: boolean;
  guncellemeTarihi: Date | string;
  kategoriAdi: string | null;
  markaAdi: string | null;
  gorselUrl: string | null;
};

export function UrunListesi({ urunler }: { urunler: ListeUrunu[] }) {
  const router = useRouter();
  const [secili, setSecili] = useState<number[]>([]);
  const [islemde, basla] = useTransition();

  const hepsiSecili = urunler.length > 0 && secili.length === urunler.length;

  function secimDegistir(id: number) {
    setSecili((onceki) =>
      onceki.includes(id) ? onceki.filter((kimlik) => kimlik !== id) : [...onceki, id],
    );
  }

  /* Sunucu eylemlerinin ortak sarmalayıcısı: sonucu bildirim olarak gösterir. */
  function calistir(
    is: () => Promise<{ durum: string; mesaj?: string }>,
    sonrasinda?: () => void,
  ) {
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
        /* Oturum düşmüş ya da bağlantı kopmuş olabilir; yakalanmazsa ekran hata
           sınırına düşer ve yönetici yaptığı işi kaybeder. */
        toast.error("İşlem tamamlanamadı. Oturumunuz sona ermiş olabilir, sayfayı yenileyin.");
      }
    });
  }

  function topluIslem(islem: "yayinla" | "gizle" | "sil") {
    if (islem === "sil") {
      const onay = window.confirm(
        `${secili.length} ürün kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`,
      );
      if (!onay) return;
    }
    calistir(
      () => urunlerToplu(secili, islem),
      () => setSecili([]),
    );
  }

  return (
    <>
      {secili.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-kart border border-kiremit/30 bg-kiremit-acik px-4 py-3">
          <span className="text-sm font-medium text-murekkep">
            <span className="rakam">{secili.length}</span> ürün seçildi
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Buton
              type="button"
              gorunum="ikincil"
              boyut="kucuk"
              disabled={islemde}
              onClick={() => topluIslem("yayinla")}
            >
              Yayına al
            </Buton>
            <Buton
              type="button"
              gorunum="ikincil"
              boyut="kucuk"
              disabled={islemde}
              onClick={() => topluIslem("gizle")}
            >
              Yayından kaldır
            </Buton>
            <Buton
              type="button"
              gorunum="tehlike"
              boyut="kucuk"
              disabled={islemde}
              onClick={() => topluIslem("sil")}
            >
              <Trash2 className="size-4" />
              Sil
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
                  onChange={() => setSecili(hepsiSecili ? [] : urunler.map((urun) => urun.id))}
                  aria-label="Tümünü seç"
                />
              </th>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Kategori / Marka</th>
              <th className="px-4 py-3 font-medium">Fiyat</th>
              <th className="px-4 py-3 font-medium">Stok</th>
              <th className="px-4 py-3 font-medium">Yayın</th>
              <th className="w-24 px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {urunler.map((urun) => {
              const yuzde = indirimYuzdesi(urun.fiyat, urun.indirimliFiyat);

              return (
                <tr
                  key={urun.id}
                  className={cn(
                    "border-b border-cizgi last:border-0 hover:bg-kum",
                    secili.includes(urun.id) && "bg-kiremit-acik/50",
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="size-4 accent-kiremit"
                      checked={secili.includes(urun.id)}
                      onChange={() => secimDegistir(urun.id)}
                      aria-label={`${urun.ad} seç`}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-yumusak border border-cizgi bg-kum">
                        {urun.gorselUrl ? (
                          <Image
                            src={urun.gorselUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <ImageOff className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-solgun" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/urunler/${urun.id}`}
                          className="block truncate font-medium text-murekkep hover:text-kiremit"
                        >
                          {urun.ad}
                        </Link>
                        <p className="rakam truncate text-xs text-solgun">
                          {urun.stokKodu ? `${urun.stokKodu} · ` : ""}
                          {tarihSaatBicimle(urun.guncellemeTarihi)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-murekkep-yumusak">
                    <p className="truncate">{urun.kategoriAdi ?? "—"}</p>
                    <p className="truncate text-xs text-solgun">{urun.markaAdi ?? "—"}</p>
                  </td>

                  <td className="px-4 py-3">
                    {urun.fiyatGizli ? (
                      <Rozet ton="notr">Fiyat gizli</Rozet>
                    ) : urun.indirimliFiyat ? (
                      <>
                        <p className="rakam font-medium text-indirim">
                          {fiyatBicimle(urun.indirimliFiyat)}
                        </p>
                        <p className="rakam text-xs text-solgun">
                          <span className="line-through">{fiyatBicimle(urun.fiyat)}</span>
                          {yuzde !== null && <span className="ml-1">%{yuzde}</span>}
                        </p>
                      </>
                    ) : (
                      <p className="rakam font-medium text-murekkep">{fiyatBicimle(urun.fiyat)}</p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <StokRozeti durum={urun.stokDurumu} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <YayinAnahtari
                        acik={urun.aktif}
                        beklemede={islemde}
                        etiket={`${urun.ad} yayın durumu`}
                        onDegis={(yeni) => calistir(() => urunDurumDegistir(urun.id, "aktif", yeni))}
                      />
                      <button
                        type="button"
                        disabled={islemde}
                        onClick={() =>
                          calistir(() => urunDurumDegistir(urun.id, "oneCikan", !urun.oneCikan))
                        }
                        title={urun.oneCikan ? "Öne çıkarılmış" : "Öne çıkar"}
                        aria-label={urun.oneCikan ? "Öne çıkarmayı kaldır" : "Öne çıkar"}
                        aria-pressed={urun.oneCikan}
                        className="rounded-yumusak p-1.5 transition-colors hover:bg-kum-koyu disabled:opacity-50"
                      >
                        <Star
                          className={cn(
                            "size-4",
                            urun.oneCikan ? "fill-kiremit text-kiremit" : "text-solgun",
                          )}
                        />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/urunler/${urun.id}`}
                        aria-label={`${urun.ad} düzenle`}
                        className="rounded-yumusak p-2 text-murekkep-yumusak transition-colors hover:bg-kum-koyu hover:text-murekkep"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        type="button"
                        disabled={islemde}
                        aria-label={`${urun.ad} sil`}
                        onClick={() => {
                          const onay = window.confirm(
                            `"${urun.ad}" kalıcı olarak silinecek. Devam edilsin mi?`,
                          );
                          if (onay) calistir(() => urunSil(urun.id));
                        }}
                        className="rounded-yumusak p-2 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TabloSarmali>
      </div>
    </>
  );
}

/** Listede yayın durumunu tek dokunuşla değiştiren anahtar. */
function YayinAnahtari({
  acik,
  beklemede,
  etiket,
  onDegis,
}: {
  acik: boolean;
  beklemede: boolean;
  etiket: string;
  onDegis: (yeni: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      aria-label={etiket}
      disabled={beklemede}
      onClick={() => onDegis(!acik)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        acik ? "bg-onay" : "bg-cizgi-koyu",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all",
          acik ? "left-[1.375rem]" : "left-0.5",
        )}
      />
    </button>
  );
}
