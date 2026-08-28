import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type KirintiAdimi = { ad: string; yol?: string };

/** Sayfa hiyerarşisini gösteren gezinme yolu. Son adım bağlantısızdır. */
export function EkmekKirintisi({ adimlar }: { adimlar: KirintiAdimi[] }) {
  return (
    <nav aria-label="Sayfa yolu" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-murekkep-yumusak">
        <li>
          <Link href="/" className="hover:text-kiremit">
            Ana Sayfa
          </Link>
        </li>
        {adimlar.map((adim, i) => (
          <li key={`${adim.ad}-${i}`} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-solgun" aria-hidden="true" />
            {adim.yol && i < adimlar.length - 1 ? (
              <Link href={adim.yol} className="hover:text-kiremit">
                {adim.ad}
              </Link>
            ) : (
              <span className="text-murekkep">{adim.ad}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
