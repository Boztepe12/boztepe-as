import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";

import {
  Panel,
  SayfaBasligi,
  TabloSarmali,
  TalepDurumRozeti,
  type TalepDurumu,
} from "@/components/admin/panel-parcalari";
import { TalepIslemleri } from "@/components/admin/talep-islemleri";
import { WhatsappSimgesi } from "@/components/site/marka-simgeleri";
import { DisBaglanti } from "@/components/ui/buton";
import { talepGetir } from "@/lib/sorgular/admin";
import { ayarGetir } from "@/lib/sorgular/icerik";
import {
  fiyatBicimle,
  tarihSaatBicimle,
  telefonBicimle,
  whatsappBaglantisi,
} from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const kayit = await talepGetir(Number(id));
  return { title: kayit ? `Talep ${kayit.talep.kod}` : "Talep" };
}

export default async function TalepDetaySayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const talepId = Number(id);
  if (!Number.isInteger(talepId) || talepId < 1) notFound();

  const [kayit, iletisim] = await Promise.all([talepGetir(talepId), ayarGetir("iletisim")]);
  if (!kayit) notFound();

  const { talep, kalemler } = kayit;

  /* Mağazanın müşteriye dönüş kanalı WhatsApp; mesajı hazır açıyoruz ki
     yönetici yalnızca gönder demek zorunda kalsın. */
  const hazirMesaj = [
    `Merhaba ${talep.adSoyad},`,
    `${talep.kod} numaralı teklif talebiniz için arıyoruz.`,
    kalemler.length > 0
      ? `Ürünler: ${kalemler.map((kalem) => `${kalem.urunAdi} (${kalem.adet} adet)`).join(", ")}`
      : "",
    "Boztepe A.Ş.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/talepler"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit"
      >
        <ArrowLeft className="size-3.5" />
        Talepler
      </Link>

      <SayfaBasligi
        baslik={`Talep ${talep.kod}`}
        aciklama={`${tarihSaatBicimle(talep.olusturmaTarihi)} tarihinde geldi.`}
        eylem={<TalepDurumRozeti durum={talep.durum as TalepDurumu} />}
      />

      <div className="space-y-5">
        <Panel baslik="Müşteri">
          <div className="space-y-4 p-5">
            <div>
              <p className="font-baslik text-xl text-murekkep">{talep.adSoyad}</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                <a
                  href={`tel:${talep.telefon.replace(/\s/g, "")}`}
                  className="rakam flex items-center gap-1.5 text-murekkep-yumusak hover:text-kiremit"
                >
                  <Phone className="size-3.5" />
                  {telefonBicimle(talep.telefon)}
                </a>
                {talep.eposta && (
                  <a
                    href={`mailto:${talep.eposta}`}
                    className="flex items-center gap-1.5 text-murekkep-yumusak hover:text-kiremit"
                  >
                    <Mail className="size-3.5" />
                    {talep.eposta}
                  </a>
                )}
              </div>
            </div>

            {talep.mesaj && (
              <div className="rounded-yumusak border border-cizgi bg-kum p-3.5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-solgun">
                  Müşterinin notu
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-murekkep">
                  {talep.mesaj}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <DisBaglanti
                href={whatsappBaglantisi(talep.telefon, hazirMesaj)}
                gorunum="whatsapp"
                boyut="kucuk"
              >
                <WhatsappSimgesi className="size-4" />
                WhatsApp&apos;tan yaz
              </DisBaglanti>
              <DisBaglanti
                href={`tel:${talep.telefon.replace(/\s/g, "")}`}
                gorunum="ikincil"
                boyut="kucuk"
              >
                <Phone className="size-4" />
                Ara
              </DisBaglanti>
              {iletisim.whatsapp && (
                <span className="self-center text-xs text-solgun">
                  Mağaza numarası: <span className="rakam">{iletisim.whatsapp}</span>
                </span>
              )}
            </div>
          </div>
        </Panel>

        <Panel
          baslik="Talep edilen ürünler"
          aciklama="Tutarlar talebin geldiği günkü fiyatlarla saklanır."
        >
          {kalemler.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-murekkep-yumusak">
              Bu talepte ürün kalemi yok.
            </p>
          ) : (
            <>
              {/* Telefon: kalemler alt alta; tablo dar ekranda okunmuyor. */}
              <ul className="divide-y divide-cizgi md:hidden">
                {kalemler.map((kalem) => (
                  <li key={kalem.id} className="px-5 py-3.5">
                    {kalem.urunSlug ? (
                      <Link
                        href={`/urun/${kalem.urunSlug}`}
                        target="_blank"
                        className="font-medium text-murekkep hover:text-kiremit"
                      >
                        {kalem.urunAdi}
                      </Link>
                    ) : (
                      <span className="font-medium text-murekkep">{kalem.urunAdi}</span>
                    )}
                    <p className="rakam mt-1 text-sm text-murekkep-yumusak">
                      {kalem.birimFiyat ? fiyatBicimle(kalem.birimFiyat) : "Fiyat sorulacak"}
                      {` × ${kalem.adet}`}
                      {kalem.birimFiyat &&
                        ` = ${fiyatBicimle(Number(kalem.birimFiyat) * kalem.adet)}`}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="hidden md:block">
                <TabloSarmali>
                  <thead>
                    <tr className="border-b border-cizgi text-left text-xs uppercase tracking-wider text-solgun">
                      <th className="px-5 py-3 font-medium">Ürün</th>
                      <th className="px-5 py-3 font-medium">Birim fiyat</th>
                      <th className="px-5 py-3 font-medium">Adet</th>
                      <th className="px-5 py-3 text-right font-medium">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kalemler.map((kalem) => (
                      <tr key={kalem.id} className="border-b border-cizgi last:border-0">
                        <td className="px-5 py-3.5">
                          {kalem.urunSlug ? (
                            <Link
                              href={`/urun/${kalem.urunSlug}`}
                              target="_blank"
                              className="font-medium text-murekkep hover:text-kiremit"
                            >
                              {kalem.urunAdi}
                            </Link>
                          ) : (
                            <span className="font-medium text-murekkep">{kalem.urunAdi}</span>
                          )}
                        </td>
                        <td className="rakam px-5 py-3.5 text-murekkep-yumusak">
                          {kalem.birimFiyat ? fiyatBicimle(kalem.birimFiyat) : "Fiyat sorulacak"}
                        </td>
                        <td className="rakam px-5 py-3.5 text-murekkep-yumusak">{kalem.adet}</td>
                        <td className="rakam px-5 py-3.5 text-right font-medium text-murekkep">
                          {kalem.birimFiyat
                            ? fiyatBicimle(Number(kalem.birimFiyat) * kalem.adet)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </TabloSarmali>
              </div>

              <div className="flex items-center justify-between border-t border-cizgi px-5 py-4">
                <span className="text-sm text-murekkep-yumusak">Toplam</span>
                <span className="rakam font-baslik text-2xl text-murekkep">
                  {talep.toplamTutar ? fiyatBicimle(talep.toplamTutar) : "—"}
                </span>
              </div>
            </>
          )}
        </Panel>

        <TalepIslemleri
          talepId={talep.id}
          durum={talep.durum as TalepDurumu}
          not={talep.yoneticiNotu}
        />
      </div>
    </div>
  );
}
