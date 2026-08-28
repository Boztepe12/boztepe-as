import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type RozetTonu = "indirim" | "yeni" | "stok" | "tukendi" | "siparis" | "notr";

const TONLAR: Record<RozetTonu, string> = {
  indirim: "bg-indirim text-white",
  yeni: "bg-murekkep text-white",
  stok: "bg-onay/12 text-onay",
  tukendi: "bg-solgun/15 text-murekkep-yumusak",
  siparis: "bg-uyari/15 text-uyari",
  notr: "bg-kum-koyu text-murekkep-yumusak",
};

export function Rozet({
  ton = "notr",
  className,
  children,
}: {
  ton?: RozetTonu;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        TONLAR[ton],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STOK_ETIKETLERI = {
  stokta: { metin: "Stokta", ton: "stok" as const },
  tukendi: { metin: "Tükendi", ton: "tukendi" as const },
  siparise_bagli: { metin: "Siparişe bağlı", ton: "siparis" as const },
};

export function StokRozeti({ durum }: { durum: keyof typeof STOK_ETIKETLERI }) {
  const { metin, ton } = STOK_ETIKETLERI[durum] ?? STOK_ETIKETLERI.stokta;
  return <Rozet ton={ton}>{metin}</Rozet>;
}
