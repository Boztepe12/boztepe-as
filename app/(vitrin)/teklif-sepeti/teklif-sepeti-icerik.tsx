"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useSepet } from "@/components/sepet/sepet-durumu";
import { WhatsappSimgesi } from "@/components/site/marka-simgeleri";
import { Buton, ButonBaglanti, DisBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import { Alan, Girdi, MetinKutusu } from "@/components/ui/form";
import { talepOlustur } from "@/lib/eylemler/talep";
import { fiyatBicimle, whatsappBaglantisi } from "@/lib/utils";

export function TeklifSepetiIcerik({ whatsappNumarasi }: { whatsappNumarasi: string }) {
  const { kalemler, toplamTutar, toplamAdet, hazir, cikar, adetDegistir, temizle } = useSepet();
  const [gonderiliyor, basla] = useTransition();
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [basariKodu, setBasariKodu] = useState<string | null>(null);

  /* Sepet localStorage'dan yüklenene kadar "boş" demek yanıltıcı olur. */
  if (!hazir) {
    return <div className="iskelet h-64 rounded-kart" />;
  }

  if (basariKodu) {
    return (
      <div className="mx-auto max-w-lg rounded-panel border border-cizgi bg-yuzey p-8 text-center shadow-kart">
        <CheckCircle2 className="mx-auto size-14 text-onay" />
        <h2 className="mt-5 font-baslik text-2xl text-murekkep">Talebiniz bize ulaştı</h2>
        <p className="mt-3 leading-relaxed text-murekkep-yumusak">
          Takip kodunuz <span className="rakam font-semibold text-murekkep">{basariKodu}</span>. En
          kısa sürede sizi arayıp fiyat ve teslimat bilgisini netleştireceğiz.
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <DisBaglanti
            href={whatsappBaglantisi(
              whatsappNumarasi,
              `Merhaba, ${basariKodu} kodlu teklif talebimi gönderdim.`,
            )}
            gorunum="whatsapp"
          >
            <WhatsappSimgesi className="size-5" />
            WhatsApp&apos;tan da yaz
          </DisBaglanti>
          <ButonBaglanti href="/urunler" gorunum="ikincil">
            Alışverişe devam et
          </ButonBaglanti>
        </div>
      </div>
    );
  }

  if (kalemler.length === 0) {
    return (
      <BosDurum
        simge={<ShoppingBag className="size-10" />}
        baslik="Teklif sepetiniz boş"
        aciklama="Beğendiğiniz ürünleri sepete ekleyin, tek seferde fiyat teklifi isteyin. Sipariş vermiş olmazsınız — biz sizi arayıp netleştiriyoruz."
        eylem={<ButonBaglanti href="/urunler">Ürünleri incele</ButonBaglanti>}
      />
    );
  }

  /* WhatsApp'a form doldurmadan gitmek isteyenler için hazır mesaj. */
  const whatsappMetni = [
    "Merhaba, aşağıdaki ürünler için teklif almak istiyorum:",
    "",
    ...kalemler.map(
      (k, i) =>
        `${i + 1}. ${k.ad} — ${k.adet} adet${k.fiyat ? ` (${fiyatBicimle(k.fiyat)})` : ""}`,
    ),
    "",
    toplamTutar > 0 ? `Yaklaşık toplam: ${fiyatBicimle(toplamTutar)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  function gonder(olay: React.FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    const form = olay.currentTarget;
    const veri = new FormData(form);

    basla(async () => {
      const sonuc = await talepOlustur({
        adSoyad: String(veri.get("adSoyad") ?? ""),
        telefon: String(veri.get("telefon") ?? ""),
        eposta: String(veri.get("eposta") ?? ""),
        mesaj: String(veri.get("mesaj") ?? ""),
        kalemler: kalemler.map((k) => ({ urunId: k.urunId, adet: k.adet })),
      });

      if (sonuc.durum === "hata") {
        setHatalar(sonuc.alanlar ?? {});
        toast.error(sonuc.mesaj);
        return;
      }

      setHatalar({});
      setBasariKodu(sonuc.kod);
      temizle();
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
      {/* Kalemler */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-murekkep-yumusak">
            <span className="rakam font-medium text-murekkep">{toplamAdet}</span> ürün
          </p>
          <button
            type="button"
            onClick={temizle}
            className="text-sm text-solgun transition-colors hover:text-hata"
          >
            Sepeti boşalt
          </button>
        </div>

        <ul className="space-y-3">
          {kalemler.map((kalem) => (
            <li
              key={kalem.urunId}
              className="flex gap-4 rounded-kart border border-cizgi bg-yuzey p-3.5"
            >
              <Link
                href={`/urun/${kalem.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-yumusak bg-kum-koyu sm:size-24"
              >
                {kalem.gorselUrl && (
                  <Image src={kalem.gorselUrl} alt="" fill sizes="6rem" className="object-cover" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                {kalem.markaAdi && (
                  <p className="text-xs uppercase tracking-wider text-solgun">{kalem.markaAdi}</p>
                )}
                <Link
                  href={`/urun/${kalem.slug}`}
                  className="text-sm font-medium leading-snug text-murekkep hover:text-kiremit"
                >
                  {kalem.ad}
                </Link>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center rounded-yumusak border border-cizgi-koyu">
                    <button
                      type="button"
                      onClick={() => adetDegistir(kalem.urunId, kalem.adet - 1)}
                      disabled={kalem.adet <= 1}
                      className="p-2 text-murekkep-yumusak hover:text-kiremit disabled:opacity-40"
                      aria-label="Adet azalt"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="rakam w-8 text-center text-sm font-medium">{kalem.adet}</span>
                    <button
                      type="button"
                      onClick={() => adetDegistir(kalem.urunId, kalem.adet + 1)}
                      className="p-2 text-murekkep-yumusak hover:text-kiremit"
                      aria-label="Adet artır"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rakam text-sm font-semibold text-murekkep">
                      {kalem.fiyat ? fiyatBicimle(kalem.fiyat * kalem.adet) : "Fiyat sorun"}
                    </span>
                    <button
                      type="button"
                      onClick={() => cikar(kalem.urunId)}
                      className="p-1.5 text-solgun transition-colors hover:text-hata"
                      aria-label={`${kalem.ad} ürününü çıkar`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <div className="rounded-panel border border-cizgi bg-yuzey p-5 shadow-kart lg:sticky lg:top-28">
        {toplamTutar > 0 && (
          <div className="mb-5 flex items-baseline justify-between border-b border-cizgi pb-4">
            <span className="text-sm text-murekkep-yumusak">Yaklaşık toplam</span>
            <span className="rakam font-baslik text-2xl text-murekkep">
              {fiyatBicimle(toplamTutar)}
            </span>
          </div>
        )}

        <h2 className="font-baslik text-xl text-murekkep">Teklif isteyin</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-murekkep-yumusak">
          Bilgilerinizi bırakın, sizi arayalım. Bu bir sipariş değildir.
        </p>

        <form onSubmit={gonder} className="mt-5 space-y-4">
          <Alan etiket="Ad Soyad" zorunlu hata={hatalar.adSoyad}>
            <Girdi
              name="adSoyad"
              required
              autoComplete="name"
              placeholder="Adınız ve soyadınız"
              aria-invalid={Boolean(hatalar.adSoyad)}
            />
          </Alan>

          <Alan etiket="Telefon" zorunlu hata={hatalar.telefon}>
            <Girdi
              name="telefon"
              type="tel"
              required
              autoComplete="tel"
              placeholder="05xx xxx xx xx"
              aria-invalid={Boolean(hatalar.telefon)}
            />
          </Alan>

          <Alan etiket="E-posta" ipucu="İsteğe bağlı" hata={hatalar.eposta}>
            <Girdi
              name="eposta"
              type="email"
              autoComplete="email"
              placeholder="ornek@eposta.com"
              aria-invalid={Boolean(hatalar.eposta)}
            />
          </Alan>

          <Alan etiket="Notunuz" ipucu="Renk, ölçü, teslimat zamanı gibi tercihleriniz">
            <MetinKutusu name="mesaj" rows={3} placeholder="Eklemek istedikleriniz…" />
          </Alan>

          <Buton type="submit" tamGenislik boyut="buyuk" disabled={gonderiliyor}>
            {gonderiliyor ? "Gönderiliyor…" : "Teklif talebi gönder"}
          </Buton>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-solgun">
          <span className="h-px flex-1 bg-cizgi" />
          veya
          <span className="h-px flex-1 bg-cizgi" />
        </div>

        <DisBaglanti
          href={whatsappBaglantisi(whatsappNumarasi, whatsappMetni)}
          gorunum="whatsapp"
          tamGenislik
        >
          <WhatsappSimgesi className="size-5" />
          WhatsApp&apos;tan gönder
        </DisBaglanti>
      </div>
    </div>
  );
}
