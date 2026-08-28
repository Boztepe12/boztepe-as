import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import {
  FacebookSimgesi,
  InstagramSimgesi,
  WhatsappSimgesi,
} from "@/components/site/marka-simgeleri";
import type { BankaHesabi } from "@/lib/db/schema";
import type { IletisimAyari, SosyalAyari } from "@/lib/sorgular/icerik";
import type { KategoriDugumu } from "@/lib/sorgular/kategoriler";
import { ibanBicimle, telefonBicimle, whatsappBaglantisi } from "@/lib/utils";

const KURUMSAL_BAGLANTILAR = [
  { ad: "Hakkımızda", yol: "/hakkimizda" },
  { ad: "Galeri", yol: "/galeri" },
  { ad: "Kampanyalar", yol: "/kampanyalar" },
  { ad: "Markalar", yol: "/markalar" },
  { ad: "İletişim", yol: "/iletisim" },
];

export function AltBilgi({
  kategoriler,
  iletisim,
  sosyal,
  bankaHesaplari,
}: {
  kategoriler: KategoriDugumu[];
  iletisim: IletisimAyari;
  sosyal: SosyalAyari;
  bankaHesaplari: BankaHesabi[];
}) {
  const yil = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-cizgi bg-kum-koyu/50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Firma */}
          <div>
            <div className="mb-4">
              <span className="font-baslik text-2xl tracking-tight text-murekkep">BOZTEPE</span>
              <span className="ml-1.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-kiremit">
                A.Ş.
              </span>
            </div>
            <p className="text-sm leading-relaxed text-murekkep-yumusak">
              {iletisim.firmaAdi}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-murekkep-yumusak">
              1963&apos;ten beri Malatya&apos;da beyaz eşya, mobilya ve halı. Vestel yetkili bayisi.
            </p>

            {(sosyal.facebook || sosyal.instagram) && (
              <div className="mt-5 flex gap-2">
                {sosyal.facebook && (
                  <a
                    href={sosyal.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-yumusak border border-cizgi-koyu p-2 text-murekkep-yumusak hover:border-kiremit hover:text-kiremit"
                    aria-label="Facebook sayfamız"
                  >
                    <FacebookSimgesi className="size-4" />
                  </a>
                )}
                {sosyal.instagram && (
                  <a
                    href={sosyal.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-yumusak border border-cizgi-koyu p-2 text-murekkep-yumusak hover:border-kiremit hover:text-kiremit"
                    aria-label="Instagram sayfamız"
                  >
                    <InstagramSimgesi className="size-4" />
                  </a>
                )}
                <a
                  href={whatsappBaglantisi(iletisim.whatsapp, "Merhaba, bilgi almak istiyorum.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-yumusak border border-cizgi-koyu p-2 text-murekkep-yumusak hover:border-[#25D366] hover:text-[#25D366]"
                  aria-label="WhatsApp ile yazın"
                >
                  <WhatsappSimgesi className="size-4" />
                </a>
              </div>
            )}
          </div>

          {/* Kategoriler */}
          <div>
            <h3 className="mb-4 font-govde text-sm font-semibold uppercase tracking-wider text-murekkep">
              Ürünler
            </h3>
            <ul className="space-y-2.5">
              {kategoriler.map((kategori) => (
                <li key={kategori.id}>
                  <Link
                    href={`/kategori/${kategori.slug}`}
                    className="text-sm text-murekkep-yumusak hover:text-kiremit"
                  >
                    {kategori.ad}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/urunler" className="text-sm text-murekkep-yumusak hover:text-kiremit">
                  Tüm Ürünler
                </Link>
              </li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="mb-4 font-govde text-sm font-semibold uppercase tracking-wider text-murekkep">
              Kurumsal
            </h3>
            <ul className="space-y-2.5">
              {KURUMSAL_BAGLANTILAR.map((baglanti) => (
                <li key={baglanti.yol}>
                  <Link
                    href={baglanti.yol}
                    className="text-sm text-murekkep-yumusak hover:text-kiremit"
                  >
                    {baglanti.ad}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="mb-4 font-govde text-sm font-semibold uppercase tracking-wider text-murekkep">
              İletişim
            </h3>
            <ul className="space-y-3 text-sm text-murekkep-yumusak">
              {iletisim.adres && (
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-kiremit" />
                  <span>{iletisim.adres}</span>
                </li>
              )}
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-kiremit" />
                <a
                  href={`tel:${iletisim.telefon.replace(/\s/g, "")}`}
                  className="hover:text-kiremit"
                >
                  {iletisim.telefon}
                </a>
              </li>
              <li className="flex gap-2.5">
                <WhatsappSimgesi className="mt-0.5 size-4 shrink-0 text-[#25D366]" />
                <a
                  href={whatsappBaglantisi(iletisim.whatsapp, "Merhaba, bilgi almak istiyorum.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-kiremit"
                >
                  {telefonBicimle(iletisim.whatsapp)}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-kiremit" />
                <a href={`mailto:${iletisim.eposta}`} className="break-all hover:text-kiremit">
                  {iletisim.eposta}
                </a>
              </li>
              {iletisim.calismaSaatleri.length > 0 && (
                <li className="flex gap-2.5">
                  <Clock className="mt-0.5 size-4 shrink-0 text-kiremit" />
                  <span>
                    {iletisim.calismaSaatleri.map((s) => (
                      <span key={s.gun} className="block">
                        {s.gun}: {s.saat}
                      </span>
                    ))}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Banka hesapları */}
        {bankaHesaplari.length > 0 && (
          <div className="mt-12 border-t border-cizgi pt-8">
            <h3 className="mb-4 font-govde text-sm font-semibold uppercase tracking-wider text-murekkep">
              Banka Hesaplarımız
            </h3>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {bankaHesaplari.map((hesap) => (
                <div key={hesap.id} className="text-sm">
                  <p className="font-medium text-murekkep">{hesap.bankaAdi}</p>
                  <p className="rakam text-xs text-murekkep-yumusak">{ibanBicimle(hesap.iban)}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-solgun">
              Tüm hesaplar {bankaHesaplari[0].hesapSahibi} adınadır.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-cizgi">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-solgun sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {yil} {iletisim.firmaAdi}. Tüm hakları saklıdır.
          </p>
          <p>Fiyatlar ve stok durumu değişiklik gösterebilir.</p>
        </div>
      </div>
    </footer>
  );
}
