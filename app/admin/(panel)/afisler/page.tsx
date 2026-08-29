import type { Metadata } from "next";
import { Image as ImageSimgesi, Plus } from "lucide-react";

import { AfisListesi, type ListeAfisi } from "@/components/admin/afis-listesi";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import { tumAfisler } from "@/lib/sorgular/admin";

export const metadata: Metadata = { title: "Afişler" };

export default async function AfislerSayfasi() {
  const afisler = await tumAfisler();

  const satirlar: ListeAfisi[] = afisler.map((afis) => ({
    id: afis.id,
    baslik: afis.baslik,
    altBaslik: afis.altBaslik,
    gorselUrl: afis.gorselUrl,
    sira: afis.sira,
    aktif: afis.aktif,
    baslangicTarihi: afis.baslangicTarihi,
    bitisTarihi: afis.bitisTarihi,
  }));

  return (
    <>
      <SayfaBasligi
        baslik="Afişler"
        aciklama="Ana sayfanın en üstünde dönen kampanya görselleri."
        eylem={
          <ButonBaglanti href="/admin/afisler/yeni">
            <Plus className="size-4" />
            Yeni afiş
          </ButonBaglanti>
        }
      />

      {satirlar.length === 0 ? (
        <BosDurum
          simge={<ImageSimgesi className="size-10" />}
          baslik="Henüz afiş yok"
          aciklama="Ana sayfada kampanya duyurmak için afiş ekleyin."
          eylem={
            <ButonBaglanti href="/admin/afisler/yeni">
              <Plus className="size-4" />
              Yeni afiş ekle
            </ButonBaglanti>
          }
        />
      ) : (
        <AfisListesi afisler={satirlar} />
      )}
    </>
  );
}
