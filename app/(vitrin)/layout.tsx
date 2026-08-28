import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SepetSaglayici } from "@/components/sepet/sepet-durumu";
import { AltBilgi } from "@/components/site/alt-bilgi";
import { WhatsappSimgesi } from "@/components/site/marka-simgeleri";
import { UstBilgi } from "@/components/site/ust-bilgi";
import { aktifBankaHesaplari, ayarGetir } from "@/lib/sorgular/icerik";
import { kategoriAgaci } from "@/lib/sorgular/kategoriler";
import { whatsappBaglantisi } from "@/lib/utils";

export default async function VitrinYerlesimi({ children }: { children: React.ReactNode }) {
  /* Başlık ve altbilgi her sayfada aynı veriyi istiyor; tek turda paralel çekiyoruz. */
  const [kategoriler, iletisim, sosyal, duyuru, hesaplar] = await Promise.all([
    kategoriAgaci(),
    ayarGetir("iletisim"),
    ayarGetir("sosyal"),
    ayarGetir("duyuru"),
    aktifBankaHesaplari(),
  ]);

  return (
    <SepetSaglayici>
      <div className="flex min-h-screen flex-col">
        {duyuru.aktif && duyuru.metin && (
          <div className="bg-murekkep text-white">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center text-sm sm:px-6">
              {duyuru.baglanti ? (
                <Link href={duyuru.baglanti} className="group flex items-center gap-2 hover:underline">
                  {duyuru.metin}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <span>{duyuru.metin}</span>
              )}
            </div>
          </div>
        )}

        <UstBilgi kategoriler={kategoriler} iletisim={iletisim} />

        <main className="flex-1">{children}</main>

        <AltBilgi
          kategoriler={kategoriler}
          iletisim={iletisim}
          sosyal={sosyal}
          bankaHesaplari={hesaplar}
        />

        {/* Sabit WhatsApp düğmesi — sipariş akışının ana kanalı olduğu için her sayfada erişilebilir. */}
        <a
          href={whatsappBaglantisi(iletisim.whatsapp, "Merhaba, bilgi almak istiyorum.")}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-panel transition-transform hover:scale-105"
          aria-label="WhatsApp ile yazın"
        >
          <WhatsappSimgesi className="size-7" />
        </a>
      </div>
    </SepetSaglayici>
  );
}
