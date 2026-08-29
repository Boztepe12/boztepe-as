import Link from "next/link";
import { AlertTriangle, ArrowRight, Plus } from "lucide-react";

import {
  OzetKutusu,
  Panel,
  SayfaBasligi,
  TabloSarmali,
  TalepDurumRozeti,
  type TalepDurumu,
} from "@/components/admin/panel-parcalari";
import { ButonBaglanti } from "@/components/ui/buton";
import { dikkatGerektirenler, panelOzeti } from "@/lib/sorgular/admin";
import { fiyatBicimle, tarihSaatBicimle } from "@/lib/utils";

export default async function PanelOzetSayfasi() {
  const [ozet, dikkat] = await Promise.all([panelOzeti(), dikkatGerektirenler()]);

  const uyariVar = dikkat.gorselsiz.length > 0 || dikkat.fiyatsiz.length > 0;

  return (
    <>
      <SayfaBasligi
        baslik="Özet"
        aciklama="Mağazanızın güncel durumu ve bekleyen işler."
        eylem={
          <ButonBaglanti href="/admin/urunler/yeni" boyut="orta">
            <Plus className="size-4" />
            Yeni ürün
          </ButonBaglanti>
        }
      />

      {/* Talepler */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OzetKutusu
          etiket="Yeni talepler"
          deger={ozet.talep.yeni}
          altMetin="Henüz aranmamış"
          yol="/admin/talepler?durum=yeni"
          vurgu={ozet.talep.yeni > 0}
        />
        <OzetKutusu
          etiket="Açık talepler"
          deger={ozet.talep.acik}
          altMetin="Süreci devam eden"
          yol="/admin/talepler"
        />
        <OzetKutusu
          etiket="Satışa dönüşen"
          deger={ozet.talep.kazanilan}
          altMetin="Toplam"
          yol="/admin/talepler?durum=satisa_donustu"
        />
        <OzetKutusu
          etiket="Toplam talep"
          deger={ozet.talep.toplam}
          yol="/admin/talepler"
        />
      </div>

      {/* Katalog */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OzetKutusu
          etiket="Yayındaki ürün"
          deger={ozet.urun.aktif}
          altMetin={`${ozet.urun.toplam} üründen`}
          yol="/admin/urunler?durum=aktif"
        />
        <OzetKutusu
          etiket="İndirimli ürün"
          deger={ozet.urun.indirimli}
          yol="/admin/urunler?durum=indirimli"
        />
        <OzetKutusu
          etiket="Tükenen ürün"
          deger={ozet.urun.tukenen}
          yol="/admin/urunler?durum=tukendi"
        />
        <OzetKutusu
          etiket="Kategori / Marka"
          deger={`${ozet.diger.kategori} / ${ozet.diger.marka}`}
          yol="/admin/kategoriler"
        />
      </div>

      {/* Dikkat gerektirenler */}
      {uyariVar && (
        <Panel
          baslik="Gözden geçirilmesi gerekenler"
          aciklama="Bu ürünler sitede eksik görünüyor."
          className="mb-6"
        >
          <div className="space-y-4 p-5">
            {dikkat.gorselsiz.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-murekkep">
                  <AlertTriangle className="size-4 text-uyari" />
                  Görseli olmayan ürünler
                </p>
                <ul className="space-y-1">
                  {dikkat.gorselsiz.map((urun) => (
                    <li key={urun.id}>
                      <Link
                        href={`/admin/urunler/${urun.id}`}
                        className="text-sm text-murekkep-yumusak hover:text-kiremit"
                      >
                        {urun.ad}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dikkat.fiyatsiz.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-murekkep">
                  <AlertTriangle className="size-4 text-uyari" />
                  Fiyatı girilmemiş ürünler
                </p>
                <ul className="space-y-1">
                  {dikkat.fiyatsiz.map((urun) => (
                    <li key={urun.id}>
                      <Link
                        href={`/admin/urunler/${urun.id}`}
                        className="text-sm text-murekkep-yumusak hover:text-kiremit"
                      >
                        {urun.ad}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Son talepler */}
      <Panel
        baslik="Son gelen talepler"
        eylem={
          <Link
            href="/admin/talepler"
            className="flex items-center gap-1.5 text-sm font-medium text-kiremit hover:underline"
          >
            Tümü
            <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        {ozet.sonTalepler.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-murekkep-yumusak">
            Henüz teklif talebi gelmedi.
          </p>
        ) : (
          <>
            {/* Telefon: kart listesi — tablo dar ekranda yana kaydırma gerektiriyor. */}
            <ul className="divide-y divide-cizgi md:hidden">
              {ozet.sonTalepler.map((talep) => (
                <li key={talep.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/talepler/${talep.id}`}
                      className="rakam font-medium text-kiremit hover:underline"
                    >
                      {talep.kod}
                    </Link>
                    <TalepDurumRozeti durum={talep.durum as TalepDurumu} />
                    <span className="rakam ml-auto text-xs text-solgun">
                      {tarihSaatBicimle(talep.olusturmaTarihi)}
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-murekkep">{talep.adSoyad}</p>
                  <p className="rakam text-sm text-murekkep-yumusak">
                    {talep.telefon} · {talep.kalemAdedi} ürün
                    {talep.toplamTutar && ` · ${fiyatBicimle(talep.toplamTutar)}`}
                  </p>
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <TabloSarmali>
                <thead>
                  <tr className="border-b border-cizgi text-left text-xs uppercase tracking-wider text-solgun">
                    <th className="px-5 py-3 font-medium">Kod</th>
                    <th className="px-5 py-3 font-medium">Müşteri</th>
                    <th className="px-5 py-3 font-medium">Ürün</th>
                    <th className="px-5 py-3 font-medium">Tutar</th>
                    <th className="px-5 py-3 font-medium">Durum</th>
                    <th className="px-5 py-3 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {ozet.sonTalepler.map((talep) => (
                    <tr key={talep.id} className="border-b border-cizgi last:border-0 hover:bg-kum">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/talepler/${talep.id}`}
                          className="rakam font-medium text-kiremit hover:underline"
                        >
                          {talep.kod}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-murekkep">{talep.adSoyad}</p>
                        <p className="rakam text-xs text-solgun">{talep.telefon}</p>
                      </td>
                      <td className="rakam px-5 py-3.5 text-murekkep-yumusak">{talep.kalemAdedi}</td>
                      <td className="rakam px-5 py-3.5 text-murekkep">
                        {talep.toplamTutar ? fiyatBicimle(talep.toplamTutar) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <TalepDurumRozeti durum={talep.durum as TalepDurumu} />
                      </td>
                      <td className="rakam px-5 py-3.5 text-xs text-solgun">
                        {tarihSaatBicimle(talep.olusturmaTarihi)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TabloSarmali>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}
