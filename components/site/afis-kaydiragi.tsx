"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import type { Afis } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function AfisKaydiragi({ afisler }: { afisler: Afis[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start", duration: 28 });
  const [etkinIndeks, setEtkinIndeks] = useState(0);

  const onceki = useCallback(() => embla?.scrollPrev(), [embla]);
  const sonraki = useCallback(() => embla?.scrollNext(), [embla]);

  useEffect(() => {
    if (!embla) return;
    const guncelle = () => setEtkinIndeks(embla.selectedScrollSnap());
    guncelle();
    embla.on("select", guncelle);
    return () => {
      embla.off("select", guncelle);
    };
  }, [embla]);

  /*
   * Otomatik geçiş sekiz saniyede bir. Kullanıcı azaltılmış hareket tercih ediyorsa
   * ya da tek afiş varsa hiç çalıştırmıyoruz.
   */
  useEffect(() => {
    if (!embla || afisler.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sayac = window.setInterval(() => embla.scrollNext(), 8000);
    return () => window.clearInterval(sayac);
  }, [embla, afisler.length]);

  if (afisler.length === 0) return null;

  return (
    <section className="relative" aria-roledescription="carousel" aria-label="Kampanyalar">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {afisler.map((afis, indeks) => (
            <div key={afis.id} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
                {afis.gorselUrl && (
                  <Image
                    src={afis.gorselUrl}
                    alt=""
                    fill
                    priority={indeks === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                )}
                {/* Metnin görsel üstünde okunabilir kalması için yumuşak koyulaştırma */}
                <div className="absolute inset-0 bg-gradient-to-r from-murekkep/75 via-murekkep/45 to-transparent" />

                <div className="absolute inset-0 flex items-center">
                  <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
                    <div className="max-w-xl text-white">
                      <h2 className="font-baslik text-3xl leading-tight sm:text-4xl lg:text-5xl">
                        {afis.baslik}
                      </h2>
                      {afis.altBaslik && (
                        <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
                          {afis.altBaslik}
                        </p>
                      )}
                      {afis.baglanti && (
                        <Link
                          href={afis.baglanti}
                          className="group mt-7 inline-flex h-12 items-center gap-2 rounded-yumusak bg-kiremit px-6 font-medium text-white transition-colors hover:bg-kiremit-koyu"
                        >
                          {afis.butonMetni ?? "İncele"}
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {afisler.length > 1 && (
        <>
          <button
            type="button"
            onClick={onceki}
            className="absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:flex"
            aria-label="Önceki kampanya"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={sonraki}
            className="absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:flex"
            aria-label="Sonraki kampanya"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {afisler.map((afis, indeks) => (
              <button
                key={afis.id}
                type="button"
                onClick={() => embla?.scrollTo(indeks)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  indeks === etkinIndeks ? "w-7 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80",
                )}
                aria-label={`${indeks + 1}. kampanyaya git`}
                aria-current={indeks === etkinIndeks}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
