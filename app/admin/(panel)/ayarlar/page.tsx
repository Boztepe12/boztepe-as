import type { Metadata } from "next";

import { AyarFormlari, type Ayarlar } from "@/components/admin/ayar-formlari";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { tumAyarlar } from "@/lib/sorgular/icerik";

export const metadata: Metadata = { title: "Site Ayarları" };

export default async function AyarlarSayfasi() {
  const ayarlar = await tumAyarlar();

  return (
    <div className="mx-auto max-w-3xl">
      <SayfaBasligi
        baslik="Site ayarları"
        aciklama="İletişim bilgileri, duyuru çubuğu ve sayfa metinleri. Her bölüm ayrı kaydedilir."
      />

      <AyarFormlari ayarlar={ayarlar as Ayarlar} />
    </div>
  );
}
