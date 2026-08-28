"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function Sayfalama({ sayfa, sayfaSayisi }: { sayfa: number; sayfaSayisi: number }) {
  const yol = usePathname();
  const parametreler = useSearchParams();

  if (sayfaSayisi <= 1) return null;

  function baglanti(hedef: number) {
    const yeni = new URLSearchParams(parametreler.toString());
    if (hedef === 1) yeni.delete("sayfa");
    else yeni.set("sayfa", String(hedef));
    const sorgu = yeni.toString();
    return sorgu ? `${yol}?${sorgu}` : yol;
  }

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Sayfalar">
      <SayfaBaglantisi
        href={baglanti(sayfa - 1)}
        etkin={sayfa > 1}
        etiket="Önceki sayfa"
        className="px-2.5"
      >
        <ChevronLeft className="size-4" />
      </SayfaBaglantisi>

      {sayfaNumaralari(sayfa, sayfaSayisi).map((numara, i) =>
        numara === null ? (
          <span key={`bosluk-${i}`} className="px-1.5 text-solgun">
            …
          </span>
        ) : (
          <SayfaBaglantisi
            key={numara}
            href={baglanti(numara)}
            etkin
            secili={numara === sayfa}
            etiket={`${numara}. sayfa`}
          >
            <span className="rakam">{numara}</span>
          </SayfaBaglantisi>
        ),
      )}

      <SayfaBaglantisi
        href={baglanti(sayfa + 1)}
        etkin={sayfa < sayfaSayisi}
        etiket="Sonraki sayfa"
        className="px-2.5"
      >
        <ChevronRight className="size-4" />
      </SayfaBaglantisi>
    </nav>
  );
}

function SayfaBaglantisi({
  href,
  etkin,
  secili,
  etiket,
  className,
  children,
}: {
  href: string;
  etkin: boolean;
  secili?: boolean;
  etiket: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ortak = cn(
    "flex h-10 min-w-10 items-center justify-center rounded-yumusak border px-3 text-sm transition-colors",
    className,
  );

  if (!etkin) {
    return (
      <span
        className={cn(ortak, "cursor-not-allowed border-cizgi text-solgun opacity-50")}
        aria-hidden="true"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={etiket}
      aria-current={secili ? "page" : undefined}
      scroll
      className={cn(
        ortak,
        secili
          ? "border-kiremit bg-kiremit font-medium text-white"
          : "border-cizgi-koyu text-murekkep hover:border-kiremit hover:text-kiremit",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Sayfa numaralarını kısaltarak dizer: 1 … 4 [5] 6 … 20
 * `null` değerler üç nokta anlamına gelir.
 */
function sayfaNumaralari(sayfa: number, toplam: number): (number | null)[] {
  if (toplam <= 7) return Array.from({ length: toplam }, (_, i) => i + 1);

  const sonuc: (number | null)[] = [1];
  const bas = Math.max(2, sayfa - 1);
  const son = Math.min(toplam - 1, sayfa + 1);

  if (bas > 2) sonuc.push(null);
  for (let i = bas; i <= son; i++) sonuc.push(i);
  if (son < toplam - 1) sonuc.push(null);

  sonuc.push(toplam);
  return sonuc;
}
