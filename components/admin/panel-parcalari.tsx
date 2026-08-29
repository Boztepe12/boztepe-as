import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Panel sayfalarının üst başlığı — başlık, açıklama ve sağda eylem düğmesi. */
export function SayfaBasligi({
  baslik,
  aciklama,
  eylem,
}: {
  baslik: string;
  aciklama?: string;
  eylem?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-baslik text-2xl text-murekkep sm:text-3xl">{baslik}</h1>
        {aciklama && <p className="mt-1.5 text-sm text-murekkep-yumusak">{aciklama}</p>}
      </div>
      {eylem && <div className="flex flex-wrap gap-2">{eylem}</div>}
    </div>
  );
}

/** Özet ekranındaki sayı kutusu. */
export function OzetKutusu({
  etiket,
  deger,
  altMetin,
  yol,
  vurgu,
}: {
  etiket: string;
  deger: string | number;
  altMetin?: string;
  yol?: string;
  vurgu?: boolean;
}) {
  const govde = (
    <>
      <p className="text-sm text-murekkep-yumusak">{etiket}</p>
      <p
        className={cn(
          "rakam mt-1.5 font-baslik text-3xl",
          vurgu ? "text-kiremit" : "text-murekkep",
        )}
      >
        {deger}
      </p>
      {altMetin && <p className="mt-1 text-xs text-solgun">{altMetin}</p>}
    </>
  );

  const sinif = cn(
    "rounded-kart border border-cizgi bg-yuzey p-5",
    yol && "transition-shadow hover:shadow-kart",
  );

  return yol ? (
    <Link href={yol} className={sinif}>
      {govde}
    </Link>
  ) : (
    <div className={sinif}>{govde}</div>
  );
}

/** İçeriği çerçeveleyen panel kutusu. */
export function Panel({
  baslik,
  aciklama,
  eylem,
  className,
  children,
}: {
  baslik?: string;
  aciklama?: string;
  eylem?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-kart border border-cizgi bg-yuzey", className)}>
      {(baslik || eylem) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cizgi px-5 py-4">
          <div>
            {baslik && <h2 className="font-govde font-semibold text-murekkep">{baslik}</h2>}
            {aciklama && <p className="mt-0.5 text-sm text-murekkep-yumusak">{aciklama}</p>}
          </div>
          {eylem}
        </div>
      )}
      {children}
    </section>
  );
}

const TALEP_DURUMLARI = {
  yeni: { etiket: "Yeni", sinif: "bg-kiremit text-white" },
  arandi: { etiket: "Arandı", sinif: "bg-uyari/15 text-uyari" },
  teklif_verildi: { etiket: "Teklif verildi", sinif: "bg-murekkep text-white" },
  satisa_donustu: { etiket: "Satışa dönüştü", sinif: "bg-onay/15 text-onay" },
  iptal: { etiket: "İptal", sinif: "bg-solgun/20 text-murekkep-yumusak" },
} as const;

export type TalepDurumu = keyof typeof TALEP_DURUMLARI;

export function TalepDurumRozeti({ durum }: { durum: TalepDurumu }) {
  const bilgi = TALEP_DURUMLARI[durum] ?? TALEP_DURUMLARI.yeni;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        bilgi.sinif,
      )}
    >
      {bilgi.etiket}
    </span>
  );
}

export const TALEP_DURUM_LISTESI = Object.entries(TALEP_DURUMLARI).map(([deger, bilgi]) => ({
  deger: deger as TalepDurumu,
  etiket: bilgi.etiket,
}));

/** Tablo görünümünde kullanılan sarmalayıcı — dar ekranda yatay kaydırır. */
export function TabloSarmali({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-sm">{children}</table>
    </div>
  );
}
