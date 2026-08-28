"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { GaleriGorseli } from "@/lib/db/schema";

export function GaleriIzgarasi({ gorseller }: { gorseller: GaleriGorseli[] }) {
  const [acikIndeks, setAcikIndeks] = useState<number | null>(null);

  const kapat = useCallback(() => setAcikIndeks(null), []);
  const ilerle = useCallback(
    (yon: 1 | -1) =>
      setAcikIndeks((mevcut) => {
        if (mevcut === null) return null;
        return (mevcut + yon + gorseller.length) % gorseller.length;
      }),
    [gorseller.length],
  );

  /* Büyütülmüş görselde klavye ile gezinme — Esc kapatır, oklar ilerletir. */
  useEffect(() => {
    if (acikIndeks === null) return;

    function tusla(olay: KeyboardEvent) {
      if (olay.key === "Escape") kapat();
      if (olay.key === "ArrowRight") ilerle(1);
      if (olay.key === "ArrowLeft") ilerle(-1);
    }

    document.addEventListener("keydown", tusla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tusla);
      document.body.style.overflow = "";
    };
  }, [acikIndeks, kapat, ilerle]);

  const acik = acikIndeks === null ? null : gorseller[acikIndeks];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {gorseller.map((gorsel, indeks) => (
          <button
            key={gorsel.id}
            type="button"
            onClick={() => setAcikIndeks(indeks)}
            className="group relative aspect-4/3 overflow-hidden rounded-kart bg-kum-koyu shadow-kart transition-shadow hover:shadow-kart-hover"
          >
            <Image
              src={gorsel.url}
              alt={gorsel.baslik ?? "Mağazamızdan bir kare"}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {gorsel.baslik && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-murekkep/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 p-3 text-left text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {gorsel.baslik}
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {acik && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-murekkep/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={acik.baslik ?? "Büyütülmüş görsel"}
        >
          <button
            type="button"
            onClick={kapat}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>

          {gorseller.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => ilerle(-1)}
                className="absolute left-4 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
                aria-label="Önceki görsel"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => ilerle(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
                aria-label="Sonraki görsel"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          <div className="relative max-h-[85vh] w-full max-w-5xl">
            <div className="relative aspect-4/3 w-full">
              <Image
                src={acik.url}
                alt={acik.baslik ?? ""}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            {acik.baslik && (
              <p className="mt-3 text-center text-sm text-white/80">{acik.baslik}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
