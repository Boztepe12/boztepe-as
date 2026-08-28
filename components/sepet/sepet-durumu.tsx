"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

const DEPO_ANAHTARI = "boztepe-teklif-sepeti";

export type SepetKalemi = {
  urunId: number;
  ad: string;
  slug: string;
  fiyat: number | null;
  gorselUrl: string | null;
  markaAdi: string | null;
  adet: number;
};

type SepetDurumu = {
  kalemler: SepetKalemi[];
  toplamAdet: number;
  toplamTutar: number;
  hazir: boolean;
  ekle: (kalem: Omit<SepetKalemi, "adet">, adet?: number) => void;
  cikar: (urunId: number) => void;
  adetDegistir: (urunId: number, adet: number) => void;
  temizle: () => void;
  icindeMi: (urunId: number) => boolean;
};

const Baglam = createContext<SepetDurumu | null>(null);

/**
 * Sepet tamamen tarayıcıda yaşar. Katalog + WhatsApp modelinde ödeme yok, bu yüzden
 * sunucuda oturum ya da sepet kaydı tutmaya gerek kalmıyor — veri ancak müşteri
 * talep formunu gönderdiğinde bir kez sunucuya gidiyor.
 */
export function SepetSaglayici({ children }: { children: ReactNode }) {
  const [kalemler, setKalemler] = useState<SepetKalemi[]>([]);
  /*
   * Sunucu tarafında localStorage yok. İlk render'ı boş sepetle yapıp veriyi
   * bağlandıktan sonra yüklüyoruz; `hazir` bayrağı da arayüzün bu arada yanlış
   * bir "sepetiniz boş" mesajı göstermesini engelliyor.
   */
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    try {
      const ham = window.localStorage.getItem(DEPO_ANAHTARI);
      if (ham) {
        const cozulen = JSON.parse(ham);
        if (Array.isArray(cozulen)) setKalemler(cozulen.filter(gecerliKalem));
      }
    } catch {
      /* Bozuk veya erişilemeyen depo — boş sepetle devam et. */
    }
    setHazir(true);
  }, []);

  useEffect(() => {
    if (!hazir) return;
    try {
      window.localStorage.setItem(DEPO_ANAHTARI, JSON.stringify(kalemler));
    } catch {
      /* Gizli sekme veya dolu depo: sepet yalnızca bu oturumda yaşar. */
    }
  }, [kalemler, hazir]);

  const ekle = useCallback((kalem: Omit<SepetKalemi, "adet">, adet = 1) => {
    setKalemler((oncekiler) => {
      const mevcut = oncekiler.find((k) => k.urunId === kalem.urunId);
      if (mevcut) {
        toast.success("Adet güncellendi", { description: kalem.ad });
        return oncekiler.map((k) =>
          k.urunId === kalem.urunId ? { ...k, adet: Math.min(99, k.adet + adet) } : k,
        );
      }
      toast.success("Teklif sepetine eklendi", { description: kalem.ad });
      return [...oncekiler, { ...kalem, adet }];
    });
  }, []);

  const cikar = useCallback((urunId: number) => {
    setKalemler((oncekiler) => oncekiler.filter((k) => k.urunId !== urunId));
  }, []);

  const adetDegistir = useCallback((urunId: number, adet: number) => {
    if (adet < 1) return;
    setKalemler((oncekiler) =>
      oncekiler.map((k) => (k.urunId === urunId ? { ...k, adet: Math.min(99, adet) } : k)),
    );
  }, []);

  const temizle = useCallback(() => setKalemler([]), []);

  const deger = useMemo<SepetDurumu>(() => {
    const toplamAdet = kalemler.reduce((t, k) => t + k.adet, 0);
    const toplamTutar = kalemler.reduce((t, k) => t + (k.fiyat ?? 0) * k.adet, 0);

    return {
      kalemler,
      toplamAdet,
      toplamTutar,
      hazir,
      ekle,
      cikar,
      adetDegistir,
      temizle,
      icindeMi: (urunId: number) => kalemler.some((k) => k.urunId === urunId),
    };
  }, [kalemler, hazir, ekle, cikar, adetDegistir, temizle]);

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useSepet(): SepetDurumu {
  const baglam = useContext(Baglam);
  if (!baglam) throw new Error("useSepet, SepetSaglayici içinde kullanılmalı.");
  return baglam;
}

function gecerliKalem(deger: unknown): deger is SepetKalemi {
  if (typeof deger !== "object" || deger === null) return false;
  const k = deger as Record<string, unknown>;
  return typeof k.urunId === "number" && typeof k.ad === "string" && typeof k.adet === "number";
}
