"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

import { Girdi, Secim } from "@/components/ui/form";
import { Buton } from "@/components/ui/buton";

export type FiltreDegeri = {
  arama: string;
  kategori: string;
  marka: string;
  yayin: string;
  stok: string;
  ozel: string;
  min: string;
  max: string;
  sirala: string;
};

export type FiltreSecenekleri = {
  kategoriler: { id: number; etiket: string; altMi: boolean }[];
  markalar: { id: number; ad: string }[];
};

/* Değerler lib/sorgular/admin.ts'teki listelerle aynı olmalı; sayfa geçersizini yok sayar. */
const YAYINLAR = [
  { deger: "", etiket: "Yayın: hepsi" },
  { deger: "aktif", etiket: "Yayında" },
  { deger: "pasif", etiket: "Yayında değil" },
];

const STOKLAR = [
  { deger: "", etiket: "Stok: hepsi" },
  { deger: "stokta", etiket: "Stokta" },
  { deger: "tukendi", etiket: "Tükendi" },
  { deger: "siparise_bagli", etiket: "Siparişe bağlı" },
];

const OZELLER = [
  { deger: "", etiket: "Diğer: hepsi" },
  { deger: "indirimli", etiket: "İndirimli" },
  { deger: "fiyatsiz", etiket: "Fiyatı girilmemiş" },
  { deger: "fiyat-gizli", etiket: "Fiyatı gizli" },
  { deger: "gorselsiz", etiket: "Fotoğrafı yok" },
  { deger: "one-cikan", etiket: "Öne çıkan" },
  { deger: "yeni", etiket: "Yeni ürün rozetli" },
  { deger: "stoktan", etiket: "Stok sisteminden gelen" },
  { deger: "elle", etiket: "Elle eklenen" },
];

const SIRALAMALAR = [
  { deger: "", etiket: "Son güncellenen" },
  { deger: "yeni", etiket: "Son eklenen" },
  { deger: "ad", etiket: "Ada göre (A–Z)" },
  { deger: "fiyat-artan", etiket: "Fiyat: düşükten yükseğe" },
  { deger: "fiyat-azalan", etiket: "Fiyat: yüksekten düşüğe" },
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
  /* Yazılan alanlar (arama, fiyat) "Ara"ya ya da Enter'a basınca uygulanır; seçimler anında. */
  const [arama, setArama] = useState(deger.arama);
  const [min, setMin] = useState(deger.min);
  const [max, setMax] = useState(deger.max);

  function gonder(degisiklik?: Partial<FiltreDegeri>) {
    const birlesik: FiltreDegeri = { ...deger, arama, min, max, ...degisiklik };
    const parametreler = new URLSearchParams();
    for (const [anahtar, d] of Object.entries(birlesik)) {
      if (d.trim()) parametreler.set(anahtar, d.trim());
    }

    /* Filtre değişince ilk sayfaya dönülür; 7. sayfada boş liste görmek şaşırtıcı olur. */
    const sorgu = parametreler.toString();
    router.push(sorgu ? `/admin/urunler?${sorgu}` : "/admin/urunler");
  }

  function temizle() {
    setArama("");
    setMin("");
    setMax("");
    router.push("/admin/urunler");
  }

  const filtreVar = Object.values(deger).some((d) => d.trim());

  return (
    <form
      onSubmit={(olay) => {
        olay.preventDefault();
        gonder();
      }}
      className="mb-5 space-y-3 rounded-kart border border-cizgi bg-yuzey p-4"
    >
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1 basis-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-solgun" />
          <Girdi
            value={arama}
            onChange={(olay) => setArama(olay.target.value)}
            placeholder="Ürün adı veya stok kodu ara"
            aria-label="Ürün ara"
            className="pl-9"
          />
        </div>
        <Buton type="submit" gorunum="ikincil">
          Ara
        </Buton>
        {filtreVar && (
          <Buton type="button" gorunum="sessiz" onClick={temizle} aria-label="Filtreleri temizle">
            <X className="size-4" />
            Temizle
          </Buton>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Secim value={deger.kategori} onChange={(o) => gonder({ kategori: o.target.value })} aria-label="Kategori">
          <option value="">Tüm kategoriler</option>
          {secenekler.kategoriler.map((kategori) => (
            <option key={kategori.id} value={kategori.id}>
              {kategori.etiket}
            </option>
          ))}
        </Secim>

        <Secim value={deger.marka} onChange={(o) => gonder({ marka: o.target.value })} aria-label="Marka">
          <option value="">Tüm markalar</option>
          {secenekler.markalar.map((marka) => (
            <option key={marka.id} value={marka.id}>
              {marka.ad}
            </option>
          ))}
        </Secim>

        <Liste deger={deger.yayin} secenekler={YAYINLAR} etiket="Yayın durumu" degisti={(d) => gonder({ yayin: d })} />
        <Liste deger={deger.stok} secenekler={STOKLAR} etiket="Stok durumu" degisti={(d) => gonder({ stok: d })} />
        <Liste deger={deger.ozel} secenekler={OZELLER} etiket="Diğer" degisti={(d) => gonder({ ozel: d })} />

        <div className="flex items-center gap-1.5">
          <Girdi
            value={min}
            onChange={(o) => setMin(o.target.value)}
            onBlur={() => min !== deger.min && gonder()}
            inputMode="numeric"
            placeholder="En az ₺"
            aria-label="En düşük fiyat"
            className="rakam min-w-0"
          />
          <span className="text-solgun">–</span>
          <Girdi
            value={max}
            onChange={(o) => setMax(o.target.value)}
            onBlur={() => max !== deger.max && gonder()}
            inputMode="numeric"
            placeholder="En çok ₺"
            aria-label="En yüksek fiyat"
            className="rakam min-w-0"
          />
        </div>

        <Liste deger={deger.sirala} secenekler={SIRALAMALAR} etiket="Sıralama" degisti={(d) => gonder({ sirala: d })} />
      </div>
    </form>
  );
}

function Liste({
  deger,
  secenekler,
  etiket,
  degisti,
}: {
  deger: string;
  secenekler: { deger: string; etiket: string }[];
  etiket: string;
  degisti: (deger: string) => void;
}) {
  return (
    <Secim value={deger} onChange={(o) => degisti(o.target.value)} aria-label={etiket}>
      {secenekler.map((s) => (
        <option key={s.deger} value={s.deger}>
          {s.etiket}
        </option>
      ))}
    </Secim>
  );
}
