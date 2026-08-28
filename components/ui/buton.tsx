import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ButonGorunumu = "birincil" | "ikincil" | "sessiz" | "whatsapp" | "tehlike";
export type ButonBoyutu = "kucuk" | "orta" | "buyuk";

const GORUNUMLER: Record<ButonGorunumu, string> = {
  birincil: "bg-kiremit text-white hover:bg-kiremit-koyu",
  ikincil:
    "bg-transparent text-murekkep border border-cizgi-koyu " +
    "hover:border-kiremit hover:text-kiremit",
  sessiz: "bg-transparent text-murekkep-yumusak hover:bg-kum-koyu hover:text-murekkep",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1da851]",
  tehlike: "bg-hata text-white hover:brightness-90",
};

const BOYUTLAR: Record<ButonBoyutu, string> = {
  kucuk: "h-9 px-3.5 text-sm gap-1.5",
  orta: "h-11 px-5 text-[0.9375rem] gap-2",
  buyuk: "h-13 px-7 text-base gap-2.5",
};

const TEMEL =
  "inline-flex items-center justify-center rounded-yumusak font-medium " +
  "transition-colors duration-150 select-none " +
  "disabled:cursor-not-allowed disabled:opacity-60";

type OrtakOzellikler = {
  gorunum?: ButonGorunumu;
  boyut?: ButonBoyutu;
  tamGenislik?: boolean;
  children: ReactNode;
};

export function Buton({
  gorunum = "birincil",
  boyut = "orta",
  tamGenislik,
  className,
  children,
  ...kalan
}: OrtakOzellikler & ComponentProps<"button">) {
  return (
    <button
      className={cn(TEMEL, GORUNUMLER[gorunum], BOYUTLAR[boyut], tamGenislik && "w-full", className)}
      {...kalan}
    >
      {children}
    </button>
  );
}

export function ButonBaglanti({
  gorunum = "birincil",
  boyut = "orta",
  tamGenislik,
  className,
  children,
  ...kalan
}: OrtakOzellikler & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(TEMEL, GORUNUMLER[gorunum], BOYUTLAR[boyut], tamGenislik && "w-full", className)}
      {...kalan}
    >
      {children}
    </Link>
  );
}

/** Dış bağlantılar (WhatsApp, harita) için — Next yönlendirmesi devreye girmemeli. */
export function DisBaglanti({
  gorunum = "birincil",
  boyut = "orta",
  tamGenislik,
  className,
  children,
  ...kalan
}: OrtakOzellikler & ComponentProps<"a">) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(TEMEL, GORUNUMLER[gorunum], BOYUTLAR[boyut], tamGenislik && "w-full", className)}
      {...kalan}
    >
      {children}
    </a>
  );
}
