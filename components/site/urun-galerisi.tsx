"use client";

import Image from "next/image";
import { useState } from "react";

import type { UrunGorseli } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function UrunGalerisi({ gorseller, urunAdi }: { gorseller: UrunGorseli[]; urunAdi: string }) {
  const [etkin, setEtkin] = useState(0);

  if (gorseller.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-kart bg-kum-koyu text-sm text-solgun">
        Görsel eklenmemiş
      </div>
    );
  }

  const gecerli = gorseller[Math.min(etkin, gorseller.length - 1)];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-kart border border-cizgi bg-yuzey">
        <Image
          src={gecerli.url}
          alt={gecerli.altMetin ?? urunAdi}
          fill
          priority
          sizes="(min-width: 1024px) 40rem, 100vw"
          className="object-cover"
        />
      </div>

      {gorseller.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2.5 sm:grid-cols-6">
          {gorseller.map((gorsel, indeks) => (
            <button
              key={gorsel.id}
              type="button"
              onClick={() => setEtkin(indeks)}
              aria-label={`${indeks + 1}. görseli göster`}
              aria-current={indeks === etkin}
              className={cn(
                "relative aspect-square overflow-hidden rounded-yumusak border-2 transition-colors",
                indeks === etkin ? "border-kiremit" : "border-cizgi hover:border-cizgi-koyu",
              )}
            >
              <Image
                src={gorsel.url}
                alt=""
                fill
                sizes="6rem"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
