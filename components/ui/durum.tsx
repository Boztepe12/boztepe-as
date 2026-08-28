import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Liste boş kaldığında gösterilen açıklayıcı kutu. */
export function BosDurum({
  simge,
  baslik,
  aciklama,
  eylem,
  className,
}: {
  simge?: ReactNode;
  baslik: string;
  aciklama?: string;
  eylem?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-kart border border-dashed",
        "border-cizgi-koyu bg-yuzey/60 px-6 py-16 text-center",
        className,
      )}
    >
      {simge && <div className="mb-4 text-solgun">{simge}</div>}
      <h3 className="font-baslik text-xl text-murekkep">{baslik}</h3>
      {aciklama && <p className="mt-2 max-w-md text-sm text-murekkep-yumusak">{aciklama}</p>}
      {eylem && <div className="mt-6">{eylem}</div>}
    </div>
  );
}

/** Yükleme sırasında ürün kartlarının yerini tutan iskelet. */
export function KartIskeleti({ adet = 4 }: { adet?: number }) {
  return (
    <>
      {Array.from({ length: adet }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-kart border border-cizgi bg-yuzey">
          <div className="iskelet aspect-4/3 w-full" />
          <div className="space-y-2.5 p-4">
            <div className="iskelet h-3 w-1/3 rounded" />
            <div className="iskelet h-4 w-4/5 rounded" />
            <div className="iskelet h-5 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}

/** Bölüm başlığı — üstünde ince terracotta kılavuz çizgisiyle. */
export function BolumBasligi({
  ustBaslik,
  baslik,
  aciklama,
  eylem,
  className,
}: {
  ustBaslik?: string;
  baslik: string;
  aciklama?: string;
  eylem?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {ustBaslik && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-kiremit">
            {ustBaslik}
          </p>
        )}
        <h2 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">{baslik}</h2>
        {aciklama && <p className="mt-3 text-murekkep-yumusak">{aciklama}</p>}
      </div>
      {eylem}
    </div>
  );
}
