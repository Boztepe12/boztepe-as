import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { WhatsappSimgesi } from "@/components/site/marka-simgeleri";
import { DisBaglanti } from "@/components/ui/buton";
import { aktifBankaHesaplari, ayarGetir } from "@/lib/sorgular/icerik";
import { ibanBicimle, telefonBicimle, whatsappBaglantisi } from "@/lib/utils";

import { IletisimFormu } from "./iletisim-formu";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Boztepe A.Ş. iletişim bilgileri, adres, çalışma saatleri ve banka hesaplarımız. Malatya.",
  alternates: { canonical: "/iletisim" },
};

export default async function IletisimSayfasi() {
  const [iletisim, hesaplar] = await Promise.all([ayarGetir("iletisim"), aktifBankaHesaplari()]);

  /* Yerel işletme olarak Google'da doğru görünmek için yapılandırılmış veri. */
  const yapisalVeri = {
    "@context": "https://schema.org",
    "@type": "HomeGoodsStore",
    name: iletisim.firmaAdi,
    telephone: iletisim.telefon,
    email: iletisim.eposta,
    address: { "@type": "PostalAddress", addressLocality: iletisim.adres, addressCountry: "TR" },
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boztepeas.com",
    foundingDate: "1963",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(yapisalVeri) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <EkmekKirintisi adimlar={[{ ad: "İletişim" }]} />

        <header className="mb-10 max-w-2xl">
          <h1 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">İletişim</h1>
          <p className="mt-3 leading-relaxed text-murekkep-yumusak">
            Telefonla arayın, WhatsApp&apos;tan yazın ya da mağazamıza uğrayın. Size yardımcı
            olmaktan memnuniyet duyarız.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-start">
          <div className="space-y-6">
            {/* Hızlı iletişim */}
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href={`tel:${iletisim.telefon.replace(/\s/g, "")}`}
                className="group rounded-kart border border-cizgi bg-yuzey p-5 shadow-kart transition-shadow hover:shadow-kart-hover"
              >
                <Phone className="size-5 text-kiremit" />
                <p className="mt-3 text-xs uppercase tracking-wider text-solgun">Telefon</p>
                <p className="rakam mt-0.5 text-lg font-medium text-murekkep group-hover:text-kiremit">
                  {iletisim.telefon}
                </p>
              </a>

              <a
                href={whatsappBaglantisi(iletisim.whatsapp, "Merhaba, bilgi almak istiyorum.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-kart border border-cizgi bg-yuzey p-5 shadow-kart transition-shadow hover:shadow-kart-hover"
              >
                <WhatsappSimgesi className="size-5 text-[#25D366]" />
                <p className="mt-3 text-xs uppercase tracking-wider text-solgun">WhatsApp</p>
                <p className="rakam mt-0.5 text-lg font-medium text-murekkep group-hover:text-kiremit">
                  {telefonBicimle(iletisim.whatsapp)}
                </p>
              </a>
            </div>

            {/* Detaylar */}
            <div className="rounded-kart border border-cizgi bg-yuzey p-6 shadow-kart">
              <dl className="space-y-5">
                <div className="flex gap-3.5">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-kiremit" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-solgun">Adres</dt>
                    <dd className="mt-1 text-murekkep">{iletisim.adres}</dd>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <Mail className="mt-0.5 size-5 shrink-0 text-kiremit" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-solgun">E-posta</dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${iletisim.eposta}`}
                        className="break-all text-murekkep hover:text-kiremit"
                      >
                        {iletisim.eposta}
                      </a>
                    </dd>
                  </div>
                </div>

                {iletisim.calismaSaatleri.length > 0 && (
                  <div className="flex gap-3.5">
                    <Clock className="mt-0.5 size-5 shrink-0 text-kiremit" />
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-solgun">
                        Çalışma saatleri
                      </dt>
                      <dd className="mt-1 space-y-0.5">
                        {iletisim.calismaSaatleri.map((saat) => (
                          <p key={saat.gun} className="text-murekkep">
                            <span className="text-murekkep-yumusak">{saat.gun}:</span> {saat.saat}
                          </p>
                        ))}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>

              {iletisim.haritaBaglantisi && (
                <DisBaglanti
                  href={iletisim.haritaBaglantisi}
                  gorunum="ikincil"
                  className="mt-6"
                  tamGenislik
                >
                  <MapPin className="size-4" />
                  Haritada göster
                </DisBaglanti>
              )}
            </div>

            {/* Banka hesapları */}
            {hesaplar.length > 0 && (
              <div className="rounded-kart border border-cizgi bg-yuzey p-6 shadow-kart">
                <h2 className="font-baslik text-xl text-murekkep">Banka Hesaplarımız</h2>
                <p className="mt-1.5 text-sm text-murekkep-yumusak">
                  Tüm hesaplar {hesaplar[0].hesapSahibi} adınadır.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {hesaplar.map((hesap) => (
                    <div
                      key={hesap.id}
                      className="rounded-yumusak border border-cizgi bg-kum-koyu/40 p-3.5"
                    >
                      <p className="text-sm font-semibold text-murekkep">{hesap.bankaAdi}</p>
                      <p className="rakam mt-1 text-sm text-murekkep-yumusak">
                        {ibanBicimle(hesap.iban)}
                      </p>
                      {hesap.sube && <p className="mt-0.5 text-xs text-solgun">{hesap.sube}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <IletisimFormu whatsappNumarasi={iletisim.whatsapp} />
        </div>
      </div>
    </>
  );
}
