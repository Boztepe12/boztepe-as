import type { Metadata } from "next";
import { BookOpen, Plus } from "lucide-react";

import { KatalogKayitListesi } from "@/components/admin/katalog-kayit-listesi";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import { tumKataloglar } from "@/lib/sorgular/admin";

export const metadata: Metadata = { title: "Kataloglar" };

export default async function KataloglarSayfasi() {
  const kataloglar = await tumKataloglar();
  const yeni = (
    <ButonBaglanti href="/admin/kataloglar/yeni">
      <Plus className="size-4" />
      Yeni katalog
    </ButonBaglanti>
  );
  return (
    <>
      <SayfaBasligi
        baslik="Kataloglar"
        aciklama="Markaların PDF katalogları ve online katalog bağlantıları. Sitede Kataloglar sayfasında gruplanmış olarak görünür."
        eylem={yeni}
      />
      {kataloglar.length === 0 ? (
        <BosDurum
          simge={<BookOpen className="size-10" />}
          baslik="Henüz katalog yok"
          aciklama="Bir PDF yükleyin ya da markanın online kataloğunun adresini ekleyin."
          eylem={yeni}
        />
      ) : (
        <KatalogKayitListesi
          kataloglar={kataloglar.map((k) => ({
            id: k.id, baslik: k.baslik, grup: k.grup, tur: k.tur, baglanti: k.baglanti, kapakUrl: k.kapakUrl, sira: k.sira, aktif: k.aktif,
          }))}
        />
      )}
    </>
  );
}
