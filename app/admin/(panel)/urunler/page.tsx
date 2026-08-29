import type { Metadata } from "next";
import { PackageSearch, Plus } from "lucide-react";

import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { PanelSayfalama } from "@/components/admin/panel-sayfalama";
import { UrunFiltreCubugu } from "@/components/admin/urun-filtre-cubugu";
import { UrunListesi, type ListeUrunu } from "@/components/admin/urun-listesi";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import { formSecenekleri, yoneticiUrunleri } from "@/lib/sorgular/admin";

export const metadata: Metadata = { title: "Ürünler" };

type Parametreler = Record<string, string | string[] | undefined>;

/** Adres çubuğunda aynı ad iki kez geçebilir; ilk değeri esas alıyoruz. */
function tek(deger: string | string[] | undefined): string {
  if (Array.isArray(deger)) return deger[0] ?? "";
  return deger ?? "";
}

export default async function UrunlerSayfasi({
  searchParams,
}: {
  searchParams: Promise<Parametreler>;
}) {
  const parametreler = await searchParams;

  const arama = tek(parametreler.arama);
  const kategori = tek(parametreler.kategori);
  const marka = tek(parametreler.marka);
  const durum = tek(parametreler.durum);
  const sayfa = Number(tek(parametreler.sayfa)) || 1;

  const [sonuc, secenekler] = await Promise.all([
    yoneticiUrunleri({
      arama: arama || undefined,
      kategoriId: Number(kategori) || undefined,
      markaId: Number(marka) || undefined,
      durum: (durum || "hepsi") as "hepsi" | "aktif" | "pasif" | "indirimli" | "tukendi",
      sayfa,
    }),
    formSecenekleri(),
  ]);

  const filtreVar = Boolean(arama || kategori || marka || (durum && durum !== "hepsi"));

  return (
    <>
      <SayfaBasligi
        baslik="Ürünler"
        aciklama={
          sonuc.toplam > 0
            ? `${sonuc.toplam} üründen ${sonuc.urunler.length} tanesi listeleniyor.`
            : "Kataloğunuzdaki ürünleri buradan yönetirsiniz."
        }
        eylem={
          <ButonBaglanti href="/admin/urunler/yeni">
            <Plus className="size-4" />
            Yeni ürün
          </ButonBaglanti>
        }
      />

      <UrunFiltreCubugu
        deger={{ arama, kategori, marka, durum }}
        secenekler={secenekler}
      />

      {sonuc.urunler.length === 0 ? (
        <BosDurum
          simge={<PackageSearch className="size-10" />}
          baslik={filtreVar ? "Bu filtreye uyan ürün yok" : "Henüz ürün eklenmemiş"}
          aciklama={
            filtreVar
              ? "Arama sözcüğünü kısaltmayı ya da filtreleri temizlemeyi deneyin."
              : "İlk ürününüzü ekleyin; eklediğiniz an sitede yayına girer."
          }
          eylem={
            filtreVar ? (
              <ButonBaglanti href="/admin/urunler" gorunum="ikincil">
                Filtreleri temizle
              </ButonBaglanti>
            ) : (
              <ButonBaglanti href="/admin/urunler/yeni">
                <Plus className="size-4" />
                Yeni ürün ekle
              </ButonBaglanti>
            )
          }
        />
      ) : (
        <>
          <UrunListesi urunler={sonuc.urunler as ListeUrunu[]} />
          <PanelSayfalama
            yol="/admin/urunler"
            sayfa={sonuc.sayfa}
            sayfaSayisi={sonuc.sayfaSayisi}
            sorgu={{
              arama: arama || undefined,
              kategori: kategori || undefined,
              marka: marka || undefined,
              durum: durum && durum !== "hepsi" ? durum : undefined,
            }}
          />
        </>
      )}
    </>
  );
}
