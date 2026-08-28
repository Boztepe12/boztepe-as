import type { Metadata } from "next";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { UrunListeleme, type AramaParametreleri } from "@/components/site/urun-listeleme";

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description:
    "Beyaz eşya, mobilya ve halı kategorilerindeki tüm ürünlerimiz. Fiyat, marka ve stok durumuna göre filtreleyin.",
};

export default async function TumUrunlerSayfasi({
  searchParams,
}: {
  searchParams: Promise<AramaParametreleri>;
}) {
  const parametreler = await searchParams;
  const arama = typeof parametreler.arama === "string" ? parametreler.arama : undefined;

  return (
    <UrunListeleme
      baslik={arama ? `"${arama}" için sonuçlar` : "Tüm Ürünler"}
      aciklama={
        arama
          ? "Aradığınızı bulamadıysanız WhatsApp'tan yazın, mağazamızda olabilir."
          : "Beyaz eşyadan mobilyaya, halıdan küçük ev aletlerine kadar tüm ürünlerimiz."
      }
      parametreler={parametreler}
      ekmekKirintisi={<EkmekKirintisi adimlar={[{ ad: arama ? "Arama" : "Tüm Ürünler" }]} />}
    />
  );
}
