import type { Metadata } from "next";
import { Plus, Tags } from "lucide-react";

import { KatalogListesi, type KatalogSatiri } from "@/components/admin/katalog-listesi";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import { tumKategoriler } from "@/lib/sorgular/admin";

export const metadata: Metadata = { title: "Kategoriler" };

export default async function KategorilerSayfasi() {
  const kategoriler = await tumKategoriler();

  /*
   * Liste düz geliyor; alt kategoriler üstlerinin hemen altında ve girintili
   * görünsün diye burada diziyoruz. Şema iki seviyeye kurgulandığı için tek
   * geçiş yeterli.
   */
  const ustler = kategoriler.filter((kategori) => !kategori.ustKategoriId);
  const sirali: KatalogSatiri[] = [];

  for (const ust of ustler) {
    sirali.push({ ...ust, altMi: false });
    for (const alt of kategoriler.filter((kategori) => kategori.ustKategoriId === ust.id)) {
      sirali.push({ ...alt, altMi: true });
    }
  }

  /* Üstü silinmiş ya da bulunamayan kategoriler kaybolmasın. */
  for (const kategori of kategoriler) {
    if (!sirali.some((satir) => satir.id === kategori.id)) {
      sirali.push({ ...kategori, altMi: false });
    }
  }

  return (
    <>
      <SayfaBasligi
        baslik="Kategoriler"
        aciklama="Menüdeki ve ana sayfadaki kategori düzenini buradan yönetirsiniz."
        eylem={
          <ButonBaglanti href="/admin/kategoriler/yeni">
            <Plus className="size-4" />
            Yeni kategori
          </ButonBaglanti>
        }
      />

      {sirali.length === 0 ? (
        <BosDurum
          simge={<Tags className="size-10" />}
          baslik="Henüz kategori yok"
          aciklama="Ürünleri gruplamak için önce kategori ekleyin."
          eylem={
            <ButonBaglanti href="/admin/kategoriler/yeni">
              <Plus className="size-4" />
              Yeni kategori ekle
            </ButonBaglanti>
          }
        />
      ) : (
        <KatalogListesi tur="kategori" satirlar={sirali} />
      )}
    </>
  );
}
