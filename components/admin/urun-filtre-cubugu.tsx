"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Girdi, Secim } from "@/components/ui/form";
import { Buton } from "@/components/ui/buton";

export type FiltreDegeri = {
  arama: string;
  kategori: string;
  marka: string;
  durum: string;
};

export type FiltreSecenekleri = {
  kategoriler: { id: number; etiket: string; altMi: boolean }[];
  markalar: { id: number; ad: string }[];
};

const DURUMLAR = [
  { deger: "hepsi", etiket: "Tüm ürünler" },
  { deger: "aktif", etiket: "Yayında" },
  { deger: "pasif", etiket: "Yayında değil" },
  { deger: "indirimli", etiket: "İndirimli" },
  { deger: "tukendi", etiket: "Tükenen" },
];

/**
 * Filtreler adres çubuğunda taşınıyor; böylece yönetici filtrelediği listeyi
 * yer imine ekleyebiliyor ve ürün düzenleyip geri döndüğünde aynı liste geliyor.
 * Boş alanlar adrese hiç yazılmıyor ki bağlantı okunur kalsın.
 */
export function UrunFiltreCubugu({
  deger,
  secenekler,
}: {
  deger: FiltreDegeri;
  secenekler: FiltreSecenekleri;
}) {
  const router = useRouter();
  const [arama, setArama] = useState(deger.arama);
  const formRef = useRef<HTMLFormElement>(null);

  function gonder(degisiklik?: Partial<FiltreDegeri>) {
    const birlesik: FiltreDegeri = { ...deger, arama, ...degisiklik };
    const parametreler = new URLSearchParams();

    if (birlesik.arama.trim()) parametreler.set("arama", birlesik.arama.trim());
    if (birlesik.kategori) parametreler.set("kategori", birlesik.kategori);
    if (birlesik.marka) parametreler.set("marka", birlesik.marka);
    if (birlesik.durum && birlesik.durum !== "hepsi") parametreler.set("durum", birlesik.durum);

    /* Filtre değişince ilk sayfaya dönülür; 7. sayfada boş liste görmek şaşırtıcı olur. */
    const sorgu = parametreler.toString();
    router.push(sorgu ? `/admin/urunler?${sorgu}` : "/admin/urunler");
  }

  const filtreVar =
    Boolean(deger.arama) ||
    Boolean(deger.kategori) ||
    Boolean(deger.marka) ||
    (Boolean(deger.durum) && deger.durum !== "hepsi");

  return (
    <form
      ref={formRef}
      onSubmit={(olay) => {
        olay.preventDefault();
        gonder();
      }}
      className="mb-5 grid gap-3 rounded-kart border border-cizgi bg-yuzey p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-solgun" />
        <Girdi
          value={arama}
          onChange={(olay) => setArama(olay.target.value)}
          placeholder="Ürün adı veya stok kodu ara"
          aria-label="Ürün ara"
          className="pl-9"
        />
      </div>

      <Secim
        value={deger.kategori}
        onChange={(olay) => gonder({ kategori: olay.target.value })}
        aria-label="Kategori"
      >
        <option value="">Tüm kategoriler</option>
        {secenekler.kategoriler.map((kategori) => (
          <option key={kategori.id} value={kategori.id}>
            {kategori.etiket}
          </option>
        ))}
      </Secim>

      <Secim
        value={deger.marka}
        onChange={(olay) => gonder({ marka: olay.target.value })}
        aria-label="Marka"
      >
        <option value="">Tüm markalar</option>
        {secenekler.markalar.map((marka) => (
          <option key={marka.id} value={marka.id}>
            {marka.ad}
          </option>
        ))}
      </Secim>

      <Secim
        value={deger.durum || "hepsi"}
        onChange={(olay) => gonder({ durum: olay.target.value })}
        aria-label="Durum"
      >
        {DURUMLAR.map((durum) => (
          <option key={durum.deger} value={durum.deger}>
            {durum.etiket}
          </option>
        ))}
      </Secim>

      <div className="flex gap-2">
        <Buton type="submit" gorunum="ikincil">
          Ara
        </Buton>
        {filtreVar && (
          <Buton
            type="button"
            gorunum="sessiz"
            onClick={() => {
              setArama("");
              router.push("/admin/urunler");
            }}
            aria-label="Filtreleri temizle"
          >
            <X className="size-4" />
            Temizle
          </Buton>
        )}
      </div>
    </form>
  );
}
