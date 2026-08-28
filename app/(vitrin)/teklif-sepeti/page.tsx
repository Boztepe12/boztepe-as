import type { Metadata } from "next";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { ayarGetir } from "@/lib/sorgular/icerik";

import { TeklifSepetiIcerik } from "./teklif-sepeti-icerik";

export const metadata: Metadata = {
  title: "Teklif Sepeti",
  description: "Beğendiğiniz ürünler için tek seferde fiyat teklifi isteyin.",
  robots: { index: false, follow: true },
};

export default async function TeklifSepetiSayfasi() {
  const iletisim = await ayarGetir("iletisim");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <EkmekKirintisi adimlar={[{ ad: "Teklif Sepeti" }]} />

      <header className="mb-8">
        <h1 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">
          Teklif Sepeti
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-murekkep-yumusak">
          Seçtiğiniz ürünler için tek seferde fiyat teklifi isteyin. Online ödeme yok — biz sizi
          arayıp fiyatı, taksit seçeneklerini ve teslimatı birlikte netleştiriyoruz.
        </p>
      </header>

      <TeklifSepetiIcerik whatsappNumarasi={iletisim.whatsapp} />
    </div>
  );
}
