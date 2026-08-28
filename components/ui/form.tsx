import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const GIRDI_TEMEL =
  "w-full rounded-yumusak border border-cizgi-koyu bg-yuzey px-3.5 text-murekkep " +
  "placeholder:text-solgun transition-colors " +
  "focus:border-kiremit focus:outline-none focus:ring-2 focus:ring-kiremit/20 " +
  "disabled:cursor-not-allowed disabled:bg-kum-koyu disabled:text-solgun " +
  "aria-[invalid=true]:border-hata aria-[invalid=true]:ring-hata/20";

export function Alan({
  etiket,
  ipucu,
  hata,
  zorunlu,
  className,
  children,
}: {
  etiket?: string;
  ipucu?: string;
  hata?: string;
  zorunlu?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      {etiket && (
        <span className="mb-1.5 block text-sm font-medium text-murekkep">
          {etiket}
          {zorunlu && (
            <span className="ml-0.5 text-kiremit" aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}
      {children}
      {hata ? (
        <span className="mt-1.5 block text-sm text-hata">{hata}</span>
      ) : ipucu ? (
        <span className="mt-1.5 block text-sm text-solgun">{ipucu}</span>
      ) : null}
    </label>
  );
}

export function Girdi({ className, ...kalan }: ComponentProps<"input">) {
  return <input className={cn(GIRDI_TEMEL, "h-11", className)} {...kalan} />;
}

export function MetinKutusu({ className, ...kalan }: ComponentProps<"textarea">) {
  return <textarea className={cn(GIRDI_TEMEL, "min-h-28 py-2.5 leading-relaxed", className)} {...kalan} />;
}

export function Secim({ className, children, ...kalan }: ComponentProps<"select">) {
  return (
    <select className={cn(GIRDI_TEMEL, "h-11 pr-9 appearance-none", className)} {...kalan}>
      {children}
    </select>
  );
}

export function Onay({
  etiket,
  className,
  ...kalan
}: { etiket: ReactNode } & ComponentProps<"input">) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-murekkep", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-kiremit"
        {...kalan}
      />
      <span>{etiket}</span>
    </label>
  );
}

/** Form alanlarını iki sütuna bölen ızgara — dar ekranda tek sütuna düşer. */
export function AlanIzgarasi({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}
