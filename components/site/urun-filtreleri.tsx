"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Buton } from "@/components/ui/buton";
import { cn, fiyatBicimle } from "@/lib/utils";

export type MarkaSecenegi = { ad: string; slug: string; adet: number };

export const SIRALAMA_SECENEKLERI = [
  { deger: "onerilen", etiket: "Önerilen" },
  { deger: "yeni", etiket: "En yeniler" },
  { deger: "fiyat-artan", etiket: "Fiyat: düşükten yükseğe" },
  { deger: "fiyat-azalan", etiket: "Fiyat: yüksekten düşüğe" },
  { deger: "populer", etiket: "En çok bakılanlar" },
] as const;

export function UrunFiltreleri({
  markalar,
  fiyatSiniri,
  toplam,
}: {
  markalar: MarkaSecenegi[];
  fiyatSiniri: { enDusuk: number; enYuksek: number };
  toplam: number;
}) {
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();
  const [mobilAcik, setMobilAcik] = useState(false);

  const secilenMarkalar = (parametreler.get("marka") ?? "").split(",").filter(Boolean);
  const minFiyat = parametreler.get("min") ?? "";
  const maxFiyat = parametreler.get("max") ?? "";
  const indirimli = parametreler.get("indirimli") === "1";
  const stokta = parametreler.get("stokta") === "1";

  /**
   * Filtre değişince sayfa numarası sıfırlanmalı; aksi halde kullanıcı 4. sayfadayken
   * filtre daralttığında boş bir sayfaya düşer.
   */
  const parametreGuncelle = useCallback(
    (degisiklikler: Record<string, string | null>) => {
      const yeni = new URLSearchParams(parametreler.toString());

      for (const [anahtar, deger] of Object.entries(degisiklikler)) {
        if (deger === null || deger === "") yeni.delete(anahtar);
        else yeni.set(anahtar, deger);
      }
      yeni.delete("sayfa");

      const sorgu = yeni.toString();
      router.push(sorgu ? `${yol}?${sorgu}` : yol, { scroll: false });
    },
    [parametreler, router, yol],
  );

  function markaDegistir(slug: string) {
    const sonraki = secilenMarkalar.includes(slug)
      ? secilenMarkalar.filter((m) => m !== slug)
      : [...secilenMarkalar, slug];
    parametreGuncelle({ marka: sonraki.join(",") });
  }

  function fiyatGonder(olay: React.FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    const veri = new FormData(olay.currentTarget);
    parametreGuncelle({
      min: String(veri.get("min") ?? ""),
      max: String(veri.get("max") ?? ""),
    });
  }

  const aktifFiltreSayisi =
    secilenMarkalar.length + (minFiyat ? 1 : 0) + (maxFiyat ? 1 : 0) + (indirimli ? 1 : 0) + (stokta ? 1 : 0);

  function hepsiniTemizle() {
    const yeni = new URLSearchParams();
    const arama = parametreler.get("arama");
    const sirala = parametreler.get("sirala");
    if (arama) yeni.set("arama", arama);
    if (sirala) yeni.set("sirala", sirala);
    const sorgu = yeni.toString();
    router.push(sorgu ? `${yol}?${sorgu}` : yol, { scroll: false });
  }

  const panel = (
    <div className="space-y-7">
      {aktifFiltreSayisi > 0 && (
        <button
          type="button"
          onClick={hepsiniTemizle}
          className="flex w-full items-center justify-between rounded-yumusak bg-kiremit-acik px-3.5 py-2.5 text-sm font-medium text-kiremit hover:brightness-97"
        >
          {aktifFiltreSayisi} filtre uygulandı
          <span className="flex items-center gap-1">
            Temizle
            <X className="size-3.5" />
          </span>
        </button>
      )}

      {/* Hızlı seçimler */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-murekkep">Hızlı seçim</legend>
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-murekkep">
            <input
              type="checkbox"
              checked={indirimli}
              onChange={(o) => parametreGuncelle({ indirimli: o.target.checked ? "1" : null })}
              className="size-4 accent-kiremit"
            />
            Sadece indirimli ürünler
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-murekkep">
            <input
              type="checkbox"
              checked={stokta}
              onChange={(o) => parametreGuncelle({ stokta: o.target.checked ? "1" : null })}
              className="size-4 accent-kiremit"
            />
            Sadece stoktakiler
          </label>
        </div>
      </fieldset>

      {/* Fiyat */}
      {fiyatSiniri.enYuksek > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-murekkep">Fiyat aralığı</legend>
          <p className="mb-2.5 text-xs text-solgun">
            {fiyatBicimle(fiyatSiniri.enDusuk)} – {fiyatBicimle(fiyatSiniri.enYuksek)}
          </p>
          <form onSubmit={fiyatGonder} className="flex items-center gap-2">
            <input
              type="number"
              name="min"
              defaultValue={minFiyat}
              min={0}
              placeholder="En az"
              aria-label="En düşük fiyat"
              className="rakam h-10 w-full min-w-0 rounded-yumusak border border-cizgi-koyu bg-yuzey px-2.5 text-sm focus:border-kiremit focus:outline-none"
            />
            <span className="text-solgun">–</span>
            <input
              type="number"
              name="max"
              defaultValue={maxFiyat}
              min={0}
              placeholder="En çok"
              aria-label="En yüksek fiyat"
              className="rakam h-10 w-full min-w-0 rounded-yumusak border border-cizgi-koyu bg-yuzey px-2.5 text-sm focus:border-kiremit focus:outline-none"
            />
            <Buton type="submit" boyut="kucuk" gorunum="ikincil" className="shrink-0">
              Uygula
            </Buton>
          </form>
        </fieldset>
      )}

      {/* Markalar */}
      {markalar.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-murekkep">Marka</legend>
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {markalar.map((marka) => (
              <label
                key={marka.slug}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-murekkep"
              >
                <input
                  type="checkbox"
                  checked={secilenMarkalar.includes(marka.slug)}
                  onChange={() => markaDegistir(marka.slug)}
                  className="size-4 shrink-0 accent-kiremit"
                />
                <span className="flex-1 truncate">{marka.ad}</span>
                <span className="rakam text-xs text-solgun">{marka.adet}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );

  return (
    <>
      {/* Mobil: filtre düğmesi ve tam ekran çekmece */}
      <div className="mb-5 flex items-center gap-3 lg:hidden">
        <Buton
          type="button"
          gorunum="ikincil"
          boyut="orta"
          onClick={() => setMobilAcik(true)}
          className="flex-1"
        >
          <SlidersHorizontal className="size-4" />
          Filtrele
          {aktifFiltreSayisi > 0 && (
            <span className="rakam ml-1 rounded-full bg-kiremit px-1.5 py-0.5 text-xs text-white">
              {aktifFiltreSayisi}
            </span>
          )}
        </Buton>
        <SiralamaSecici />
      </div>

      {mobilAcik && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-murekkep/40"
            onClick={() => setMobilAcik(false)}
            aria-label="Filtreleri kapat"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-panel bg-kum p-5 shadow-panel">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-baslik text-xl text-murekkep">Filtrele</h2>
              <button
                type="button"
                onClick={() => setMobilAcik(false)}
                className="rounded-yumusak p-2 text-murekkep hover:bg-kum-koyu"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            {panel}
            <Buton
              type="button"
              onClick={() => setMobilAcik(false)}
              tamGenislik
              className="mt-7"
            >
              {toplam} ürünü göster
            </Buton>
          </div>
        </div>
      )}

      {/* Masaüstü: yan panel */}
      <aside className="hidden lg:block">{panel}</aside>
    </>
  );
}

export function SiralamaSecici() {
  const router = useRouter();
  const yol = usePathname();
  const parametreler = useSearchParams();
  const mevcut = parametreler.get("sirala") ?? "onerilen";

  function degistir(deger: string) {
    const yeni = new URLSearchParams(parametreler.toString());
    if (deger === "onerilen") yeni.delete("sirala");
    else yeni.set("sirala", deger);
    yeni.delete("sayfa");
    const sorgu = yeni.toString();
    router.push(sorgu ? `${yol}?${sorgu}` : yol, { scroll: false });
  }

  return (
    <select
      value={mevcut}
      onChange={(o) => degistir(o.target.value)}
      aria-label="Sıralama"
      className={cn(
        "h-11 shrink-0 rounded-yumusak border border-cizgi-koyu bg-yuzey px-3 text-sm",
        "text-murekkep focus:border-kiremit focus:outline-none",
      )}
    >
      {SIRALAMA_SECENEKLERI.map((secenek) => (
        <option key={secenek.deger} value={secenek.deger}>
          {secenek.etiket}
        </option>
      ))}
    </select>
  );
}
