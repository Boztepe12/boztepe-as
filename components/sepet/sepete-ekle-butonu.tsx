"use client";

import { Check, ShoppingBag } from "lucide-react";

import { Buton, type ButonBoyutu, type ButonGorunumu } from "@/components/ui/buton";
import { useSepet } from "@/components/sepet/sepet-durumu";

type Ozellikler = {
  urunId: number;
  ad: string;
  slug: string;
  fiyat: string | number | null;
  gorselUrl: string | null;
  markaAdi?: string | null;
  adet?: number;
  boyut?: ButonBoyutu;
  gorunum?: ButonGorunumu;
  tamGenislik?: boolean;
  etiket?: string;
};

export function SepeteEkleButonu({
  urunId,
  ad,
  slug,
  fiyat,
  gorselUrl,
  markaAdi = null,
  adet = 1,
  boyut = "orta",
  gorunum = "birincil",
  tamGenislik,
  etiket = "Teklife ekle",
}: Ozellikler) {
  const { ekle, icindeMi } = useSepet();
  const eklendi = icindeMi(urunId);

  const sayisalFiyat = fiyat === null ? null : Number(fiyat);

  return (
    <Buton
      type="button"
      boyut={boyut}
      gorunum={eklendi ? "ikincil" : gorunum}
      tamGenislik={tamGenislik}
      onClick={() =>
        ekle(
          {
            urunId,
            ad,
            slug,
            fiyat: Number.isFinite(sayisalFiyat) ? sayisalFiyat : null,
            gorselUrl,
            markaAdi,
          },
          adet,
        )
      }
    >
      {eklendi ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
      {eklendi ? "Sepette" : etiket}
    </Buton>
  );
}
