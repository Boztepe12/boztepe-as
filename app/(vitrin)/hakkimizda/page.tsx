import type { Metadata } from "next";
import { Phone } from "lucide-react";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { WhatsappSimgesi } from "@/components/site/marka-simgeleri";
import { ButonBaglanti, DisBaglanti } from "@/components/ui/buton";
import { aktifMarkalar, ayarGetir } from "@/lib/sorgular/icerik";
import { whatsappBaglantisi } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const hakkimizda = await ayarGetir("hakkimizda");
  return {
    title: "Hakkımızda",
    description: hakkimizda.ozet || "Boztepe Ev Gereçleri — 1963'ten beri Malatya'da.",
    alternates: { canonical: "/hakkimizda" },
  };
}

export default async function HakkimizdaSayfasi() {
  const [hakkimizda, iletisim, markalar] = await Promise.all([
    ayarGetir("hakkimizda"),
    ayarGetir("iletisim"),
    aktifMarkalar(),
  ]);

  const gecenYil = new Date().getFullYear() - hakkimizda.kurulusYili;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <EkmekKirintisi adimlar={[{ ad: "Hakkımızda" }]} />

      <header className="max-w-3xl">
        <p className="kilavuz-cizgi mb-2 text-xs font-medium uppercase tracking-[0.18em] text-kiremit">
          Hakkımızda
        </p>
        <h1 className="font-baslik text-4xl leading-tight text-murekkep sm:text-5xl">
          {hakkimizda.baslik}
        </h1>
        {hakkimizda.ozet && (
          <p className="mt-5 text-lg leading-relaxed text-murekkep-yumusak">{hakkimizda.ozet}</p>
        )}
      </header>

      {/* Sayılarla */}
      <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {[
          { sayi: `${gecenYil}+`, etiket: "yıllık tecrübe" },
          { sayi: "3", etiket: "kuşaktır aynı ailede" },
          { sayi: `${markalar.length}`, etiket: "marka" },
          { sayi: "3", etiket: "ürün kolu" },
        ].map((madde) => (
          <div
            key={madde.etiket}
            className="rounded-kart border border-cizgi bg-yuzey p-5 text-center shadow-kart"
          >
            <p className="rakam font-baslik text-3xl text-kiremit sm:text-4xl">{madde.sayi}</p>
            <p className="mt-1.5 text-sm text-murekkep-yumusak">{madde.etiket}</p>
          </div>
        ))}
      </div>

      {/* Hikâye */}
      {hakkimizda.paragraflar.length > 0 && (
        <section className="mt-14 max-w-3xl">
          <div className="space-y-5 text-[1.0625rem] leading-relaxed text-murekkep-yumusak">
            {hakkimizda.paragraflar.map((paragraf, i) => (
              <p key={i}>{paragraf}</p>
            ))}
          </div>
        </section>
      )}

      {/* Değerler */}
      {hakkimizda.degerler.length > 0 && (
        <section className="mt-16">
          <h2 className="kilavuz-cizgi font-baslik text-2xl text-murekkep sm:text-3xl">
            Neye önem veriyoruz
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hakkimizda.degerler.map((deger) => (
              <div
                key={deger.baslik}
                className="rounded-kart border border-cizgi bg-yuzey p-5 shadow-kart"
              >
                <h3 className="font-govde font-semibold text-murekkep">{deger.baslik}</h3>
                <p className="mt-2 text-sm leading-relaxed text-murekkep-yumusak">{deger.metin}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Markalar */}
      {markalar.length > 0 && (
        <section className="mt-16">
          <h2 className="kilavuz-cizgi font-baslik text-2xl text-murekkep sm:text-3xl">
            Çalıştığımız markalar
          </h2>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {markalar.map((marka) => (
              <span
                key={marka.id}
                className="rounded-full border border-cizgi bg-yuzey px-4 py-2 text-sm text-murekkep-yumusak"
              >
                {marka.ad}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Davet */}
      <section className="mt-16 rounded-panel border border-cizgi bg-kum-koyu/50 p-8 text-center sm:p-12">
        <h2 className="font-baslik text-2xl text-murekkep sm:text-3xl">Mağazamıza bekleriz</h2>
        <p className="mx-auto mt-3 max-w-xl leading-relaxed text-murekkep-yumusak">
          Ürünleri yerinde görmek, dokunmak ve ölçü almak için showroomumuza uğrayın. Aklınıza
          takılan her şeyi telefonla ya da WhatsApp&apos;tan da sorabilirsiniz.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <DisBaglanti href={`tel:${iletisim.telefon.replace(/\s/g, "")}`} gorunum="birincil">
            <Phone className="size-4" />
            {iletisim.telefon}
          </DisBaglanti>
          <DisBaglanti
            href={whatsappBaglantisi(iletisim.whatsapp, "Merhaba, bilgi almak istiyorum.")}
            gorunum="whatsapp"
          >
            <WhatsappSimgesi className="size-5" />
            WhatsApp
          </DisBaglanti>
          <ButonBaglanti href="/iletisim" gorunum="ikincil">
            İletişim bilgileri
          </ButonBaglanti>
        </div>
      </section>
    </div>
  );
}
