import Image from "next/image";

import { cn } from "@/lib/utils";

/*
 * Boztepe A.Ş.'nin logosu (boztepeas.com'daki görselin saydam, kırpılmış hali):
 * "Boztepe a.ş." yazısı, B işareti, "İbrahim BOZTEPE" ve "Bir Dost Sıcaklığıyla
 * Yakınınızda". Yükseklik sınıfla verilir; genişlik orana göre gelir.
 */
const LOGO = { src: "/marka/boztepe-logo.png", en: 1450, boy: 282 };
const ISARET = { src: "/marka/boztepe-isaret.png", en: 309, boy: 206 };

export function MarkaLogosu({ className, oncelikli = false }: { className?: string; oncelikli?: boolean }) {
  return (
    <Image
      src={LOGO.src}
      width={LOGO.en}
      height={LOGO.boy}
      alt="Boztepe A.Ş. — Bir Dost Sıcaklığıyla Yakınınızda"
      priority={oncelikli}
      className={cn("h-10 w-auto", className)}
    />
  );
}

/** Yalnız B işareti: dar alanlar (daraltılmış yönetim menüsü). */
export function MarkaIsareti({ className }: { className?: string }) {
  return <Image src={ISARET.src} width={ISARET.en} height={ISARET.boy} alt="Boztepe A.Ş." className={cn("h-8 w-auto", className)} />;
}
