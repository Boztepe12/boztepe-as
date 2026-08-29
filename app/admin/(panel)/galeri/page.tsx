import type { Metadata } from "next";

import { GaleriYonetimi, type GaleriKaydi } from "@/components/admin/galeri-yonetimi";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { tumGaleri } from "@/lib/sorgular/admin";
import { cloudinaryHazir } from "@/lib/storage";

export const metadata: Metadata = { title: "Galeri" };

export default async function GaleriSayfasi() {
  const gorseller = await tumGaleri();

  const kayitlar: GaleriKaydi[] = gorseller.map((gorsel) => ({
    id: gorsel.id,
    baslik: gorsel.baslik,
    url: gorsel.url,
    aktif: gorsel.aktif,
  }));

  return (
    <>
      <SayfaBasligi
        baslik="Galeri"
        aciklama="Mağaza ve teşhir fotoğrafları. Sitedeki galeri sayfasında görünür."
      />

      <GaleriYonetimi gorseller={kayitlar} />

      {!cloudinaryHazir && (
        <p className="mt-4 rounded-yumusak border border-uyari/30 bg-uyari/8 px-3.5 py-2.5 text-sm text-murekkep-yumusak">
          Cloudinary anahtarları tanımlı olmadığı için fotoğraflar bu bilgisayarda{" "}
          <code className="rakam">public/yuklenenler</code> klasörüne kaydediliyor. Site yayına
          alınmadan önce anahtarların girilmesi gerekiyor.
        </p>
      )}
    </>
  );
}
