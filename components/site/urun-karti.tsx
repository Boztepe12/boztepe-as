import Image from "next/image";
import Link from "next/link";

import { SepeteEkleButonu } from "@/components/sepet/sepete-ekle-butonu";
import { Rozet } from "@/components/ui/rozet";
import type { ListelenenUrun } from "@/lib/sorgular/urunler";
import { cn, fiyatBicimle, indirimYuzdesi, taksitMetni } from "@/lib/utils";

export function UrunKarti({ urun, oncelikli }: { urun: ListelenenUrun; oncelikli?: boolean }) {
  const indirim = indirimYuzdesi(urun.fiyat, urun.indirimliFiyat);
  const gecerliFiyat = urun.indirimliFiyat ?? urun.fiyat;
  const taksit = urun.taksitSayisi && gecerliFiyat ? taksitMetni(gecerliFiyat, urun.taksitSayisi) : null;
  const tukendi = urun.stokDurumu === "tukendi";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-kart border border-cizgi bg-yuzey",
        "shadow-kart transition-shadow duration-200 hover:shadow-kart-hover",
      )}
    >
      <Link href={`/urun/${urun.slug}`} className="relative block aspect-4/3 overflow-hidden bg-kum-koyu">
        {urun.gorselUrl ? (
          <Image
            src={urun.gorselUrl}
            alt={urun.ad}
            fill
            sizes="(min-width: 1280px) 20rem, (min-width: 768px) 33vw, 50vw"
            priority={oncelikli}
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-[1.04]",
              tukendi && "opacity-60 grayscale",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-solgun">
            Görsel yok
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {indirim && <Rozet ton="indirim">%{indirim} indirim</Rozet>}
          {urun.yeniUrun && !indirim && <Rozet ton="yeni">Yeni</Rozet>}
        </div>

        {tukendi && (
          <div className="absolute inset-x-0 bottom-0 bg-murekkep/80 py-2 text-center text-xs font-medium text-white">
            Şu an tükendi
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {urun.markaAdi && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-solgun">
            {urun.markaAdi}
          </p>
        )}

        <h3 className="font-govde text-[0.9375rem] font-medium leading-snug text-murekkep">
          <Link href={`/urun/${urun.slug}`} className="hover:text-kiremit">
            {urun.ad}
          </Link>
        </h3>

        {urun.kisaAciklama && (
          <p className="mt-1.5 line-clamp-2 text-sm text-murekkep-yumusak">{urun.kisaAciklama}</p>
        )}

        <div className="mt-auto pt-4">
          {urun.fiyatGizli ? (
            <p className="text-sm font-medium text-kiremit">Fiyat için bize ulaşın</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="rakam text-lg font-semibold text-murekkep">
                  {fiyatBicimle(gecerliFiyat)}
                </span>
                {indirim && (
                  <span className="rakam text-sm text-solgun line-through">
                    {fiyatBicimle(urun.fiyat)}
                  </span>
                )}
              </div>
              {taksit && <p className="rakam mt-0.5 text-xs text-murekkep-yumusak">{taksit}</p>}
            </>
          )}

          <div className="mt-3">
            <SepeteEkleButonu
              urunId={urun.id}
              ad={urun.ad}
              slug={urun.slug}
              fiyat={urun.fiyatGizli ? null : gecerliFiyat}
              gorselUrl={urun.gorselUrl}
              markaAdi={urun.markaAdi}
              boyut="kucuk"
              gorunum="ikincil"
              tamGenislik
            />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Ürün kartlarını tutarlı bir ızgarada dizer. */
export function UrunIzgarasi({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
  );
}
