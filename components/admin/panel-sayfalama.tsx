import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Panel listelerinin sayfalayıcısı. Vitrindeki sayfalayıcı adres parametrelerini
 * `useSearchParams` ile okuyan bir istemci bileşeni; burada filtreler zaten sunucuda
 * çözülmüş durumda olduğu için bağlantıları doğrudan üretmek hem daha az JavaScript
 * hem de daha az kırılgan.
 */
export function PanelSayfalama({
  yol,
  sayfa,
  sayfaSayisi,
  sorgu = {},
}: {
  yol: string;
  sayfa: number;
  sayfaSayisi: number;
  sorgu?: Record<string, string | undefined>;
}) {
  if (sayfaSayisi <= 1) return null;

  function baglanti(hedef: number) {
    const parametreler = new URLSearchParams();
    for (const [anahtar, deger] of Object.entries(sorgu)) {
      if (deger) parametreler.set(anahtar, deger);
    }
    if (hedef > 1) parametreler.set("sayfa", String(hedef));
    const metin = parametreler.toString();
    return metin ? `${yol}?${metin}` : yol;
  }

  const numaralar = sayfaNumaralari(sayfa, sayfaSayisi);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Sayfalar">
      <Adim href={baglanti(sayfa - 1)} etkin={sayfa > 1} etiket="Önceki sayfa">
        <ChevronLeft className="size-4" />
      </Adim>

      {numaralar.map((numara, sira) =>
        numara === null ? (
          <span key={`bosluk-${sira}`} className="px-1.5 text-solgun">
            …
          </span>
        ) : (
          <Adim
            key={numara}
            href={baglanti(numara)}
            etkin
            secili={numara === sayfa}
            etiket={`${numara}. sayfa`}
          >
            <span className="rakam">{numara}</span>
          </Adim>
        ),
      )}

      <Adim href={baglanti(sayfa + 1)} etkin={sayfa < sayfaSayisi} etiket="Sonraki sayfa">
        <ChevronRight className="size-4" />
      </Adim>
    </nav>
  );
}

function Adim({
  href,
  etkin,
  secili,
  etiket,
  children,
}: {
  href: string;
  etkin: boolean;
  secili?: boolean;
  etiket: string;
  children: React.ReactNode;
}) {
  const ortak =
    "flex h-9 min-w-9 items-center justify-center rounded-yumusak border px-2.5 text-sm transition-colors";

  if (!etkin) {
    return (
      <span className={cn(ortak, "border-cizgi text-solgun opacity-50")} aria-hidden="true">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={etiket}
      aria-current={secili ? "page" : undefined}
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

/** Sayfa numaralarını kısaltarak dizer: 1 … 4 [5] 6 … 20 — `null` üç nokta demektir. */
function sayfaNumaralari(sayfa: number, toplam: number): (number | null)[] {
  if (toplam <= 7) return Array.from({ length: toplam }, (_, sira) => sira + 1);

  const sonuc: (number | null)[] = [1];
  const bas = Math.max(2, sayfa - 1);
  const son = Math.min(toplam - 1, sayfa + 1);

  if (bas > 2) sonuc.push(null);
  for (let numara = bas; numara <= son; numara++) sonuc.push(numara);
  if (son < toplam - 1) sonuc.push(null);

  sonuc.push(toplam);
  return sonuc;
}
