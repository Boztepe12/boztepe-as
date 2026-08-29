import type { Metadata } from "next";
import { Plus, Tags } from "lucide-react";

import { KatalogListesi, type KatalogSatiri } from "@/components/admin/katalog-listesi";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import { tumMarkalar } from "@/lib/sorgular/admin";

export const metadata: Metadata = { title: "Markalar" };

export default async function MarkalarSayfasi() {
  const markalar = await tumMarkalar();

  const satirlar: KatalogSatiri[] = markalar.map((marka) => ({
    id: marka.id,
    ad: marka.ad,
    slug: marka.slug,
    gorselUrl: marka.logoUrl,
    sira: marka.sira,
    aktif: marka.aktif,
    urunAdedi: marka.urunAdedi,
  }));

  return (
    <>
      <SayfaBasligi
        baslik="Markalar"
        aciklama="Sitede listelenen markalar ve logoları."
        eylem={
          <ButonBaglanti href="/admin/markalar/yeni">
            <Plus className="size-4" />
            Yeni marka
          </ButonBaglanti>
        }
      />

      {satirlar.length === 0 ? (
        <BosDurum
          simge={<Tags className="size-10" />}
          baslik="Henüz marka yok"
          aciklama="Ürünleri markalarına göre filtrelemek için marka ekleyin."
          eylem={
            <ButonBaglanti href="/admin/markalar/yeni">
              <Plus className="size-4" />
              Yeni marka ekle
            </ButonBaglanti>
          }
        />
      ) : (
        <KatalogListesi tur="marka" satirlar={satirlar} />
      )}
    </>
  );
}
