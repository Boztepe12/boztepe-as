import type { Metadata } from "next";

import { BankaListesi, type BankaKaydi } from "@/components/admin/banka-listesi";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { tumBankaHesaplari } from "@/lib/sorgular/admin";
import { ayarGetir } from "@/lib/sorgular/icerik";

export const metadata: Metadata = { title: "Banka Hesapları" };

export default async function BankaSayfasi() {
  const [hesaplar, iletisim] = await Promise.all([tumBankaHesaplari(), ayarGetir("iletisim")]);

  const kayitlar: BankaKaydi[] = hesaplar.map((hesap) => ({
    id: hesap.id,
    bankaAdi: hesap.bankaAdi,
    hesapSahibi: hesap.hesapSahibi,
    iban: hesap.iban,
    sube: hesap.sube,
    sira: hesap.sira,
    aktif: hesap.aktif,
  }));

  return (
    <>
      <SayfaBasligi
        baslik="Banka hesapları"
        aciklama="Havale ve EFT için müşterilere gösterilen hesaplar."
      />

      <BankaListesi hesaplar={kayitlar} varsayilanSahip={iletisim.firmaAdi} />
    </>
  );
}
