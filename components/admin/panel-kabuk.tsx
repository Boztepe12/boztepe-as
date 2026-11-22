"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Images,
  Inbox,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Settings,
  Tag,
  Tags,
  X,
  type LucideIcon,
} from "lucide-react";

import { MENU_CEREZI } from "@/lib/admin-menu";
import { cikisYap } from "@/lib/auth/giris";
import type { OturumBilgisi } from "@/lib/auth/oturum";
import { cn } from "@/lib/utils";
import { MarkaIsareti, MarkaLogosu } from "@/components/site/marka-logosu";

/*
 * Yönetim panelinin menüsü tek yerde: gruplar ve satırlar. Yapı Selstok
 * panelindekiyle aynı — gruplu, simgeli, daraltılabilen kenar çubuğu; üstte
 * "Grup › Sayfa"; telefonda çekmece. Yeni ekran = buraya bir satır.
 */
type Satir = { ad: string; yol: string; simge: LucideIcon; tam?: boolean; rozet?: "talep" };
type Grup = { ad: string; satirlar: Satir[] };

export const MENU: Grup[] = [
  {
    ad: "Günlük",
    satirlar: [
      { ad: "Özet", yol: "/admin", simge: LayoutDashboard, tam: true },
      { ad: "Talepler", yol: "/admin/talepler", simge: Inbox, rozet: "talep" },
    ],
  },
  {
    ad: "Katalog",
    satirlar: [
      { ad: "Ürünler", yol: "/admin/urunler", simge: Package },
      { ad: "Kategoriler", yol: "/admin/kategoriler", simge: Tags },
      { ad: "Markalar", yol: "/admin/markalar", simge: Tag },
      { ad: "Stok Bağlantısı", yol: "/admin/stok", simge: RefreshCw },
    ],
  },
  {
    ad: "İçerik",
    satirlar: [
      { ad: "Afişler", yol: "/admin/afisler", simge: ImageIcon },
      { ad: "Kataloglar", yol: "/admin/kataloglar", simge: BookOpen },
      { ad: "Galeri", yol: "/admin/galeri", simge: Images },
    ],
  },
  {
    ad: "Ayarlar",
    satirlar: [
      { ad: "Banka Hesapları", yol: "/admin/banka", simge: Landmark },
      { ad: "Site Ayarları", yol: "/admin/ayarlar", simge: Settings },
    ],
  },
];

/* Daraltma tercihi çerezde (lib/admin-menu.ts), ki sunucu ilk çizimde doğru genişliği versin. */

function cerezYaz(dar: boolean) {
  document.cookie = `${MENU_CEREZI}=${dar ? "dar" : ""}; path=/admin; max-age=${dar ? 60 * 60 * 24 * 365 : 0}; samesite=lax`;
}

/** Bir yolun yaktığı satır: kendisi ya da altında durduğu satır (en uzun eşleşme). */
export function etkinSatir(yol: string): Satir | undefined {
  const hepsi = MENU.flatMap((g) => g.satirlar);
  return hepsi
    .filter((s) => (s.tam ? yol === s.yol : yol === s.yol || yol.startsWith(`${s.yol}/`)))
    .sort((a, b) => b.yol.length - a.yol.length)[0];
}

type KonumParcasi = { ad: string; yol: string };

/**
 * Üst bardaki konum: "Katalog › Ürünler › Yeni" gibi. Her parça bir yere gider:
 * grup kendi ilk sayfasına, sayfa kendi listesine. Son parça bulunulan yerdir,
 * bağlantı olarak çizilmez.
 */
export function konum(yol: string): KonumParcasi[] {
  if (yol === "/admin/hesap" || yol.startsWith("/admin/hesap/")) return [{ ad: "Hesabım", yol: "/admin/hesap" }];
  const satir = etkinSatir(yol);
  if (!satir) return [];
  const grup = MENU.find((g) => g.satirlar.includes(satir))!;
  const parcalar = [
    { ad: grup.ad, yol: grup.satirlar[0].yol },
    { ad: satir.ad, yol: satir.yol },
  ];
  if (yol !== satir.yol) parcalar.push({ ad: yol.endsWith("/yeni") ? "Yeni" : "Düzenle", yol });
  return parcalar;
}

export function PanelKabuk({
  oturum,
  bekleyenTalep,
  dar: ilkDar,
  children,
}: {
  oturum: OturumBilgisi;
  bekleyenTalep: number;
  /** Kenar çubuğu simge şeridine daraltılmış mı (çerezden). */
  dar: boolean;
  children: React.ReactNode;
}) {
  const yol = usePathname();
  const [dar, setDar] = useState(ilkDar);
  // Çekmece açıldığı sayfada açık: bir satıra dokununca yol değişir, kendiliğinden kapanır.
  const [cekmeceYolu, setCekmeceYolu] = useState<string | null>(null);
  const cekmece = cekmeceYolu === yol;
  const parcalar = konum(yol);

  function daralt() {
    setDar(!dar);
    cerezYaz(!dar);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-kum">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-cizgi bg-yuzey transition-[width] duration-150 lg:flex",
          dar ? "w-16" : "w-64",
        )}
      >
        <KenarCubugu oturum={oturum} bekleyenTalep={bekleyenTalep} yol={yol} dar={dar} daralt={daralt} />
      </aside>

      {cekmece && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menü">
          <button
            type="button"
            className="absolute inset-0 bg-murekkep/40"
            onClick={() => setCekmeceYolu(null)}
            aria-label="Menüyü kapat"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-yuzey shadow-panel">
            <button
              type="button"
              onClick={() => setCekmeceYolu(null)}
              className="absolute right-2 top-3 rounded-yumusak p-2 text-murekkep-yumusak hover:bg-kum-koyu"
              aria-label="Kapat"
            >
              <X className="size-5" />
            </button>
            <KenarCubugu oturum={oturum} bekleyenTalep={bekleyenTalep} yol={yol} dar={false} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-cizgi bg-yuzey px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setCekmeceYolu(yol)}
            className="-ml-1 rounded-yumusak p-2 text-murekkep hover:bg-kum-koyu lg:hidden"
            aria-label="Menüyü aç"
          >
            <Menu className="size-5" />
          </button>
          <nav aria-label="Konum" className="flex min-w-0 items-center gap-1.5 text-sm">
            {parcalar.map((p, i) => (
              <span key={`${p.ad}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-solgun" />}
                {i === parcalar.length - 1 ? (
                  <span className="truncate font-medium text-murekkep" aria-current="page">
                    {p.ad}
                  </span>
                ) : (
                  <Link
                    href={p.yol}
                    className="hidden truncate rounded-yumusak text-solgun transition-colors hover:text-kiremit hover:underline sm:inline"
                  >
                    {p.ad}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <Link
            href="/"
            target="_blank"
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-yumusak px-2.5 py-1.5 text-sm text-murekkep-yumusak hover:bg-kum-koyu hover:text-murekkep"
          >
            <ExternalLink className="size-4" />
            <span className="hidden sm:inline">Siteyi görüntüle</span>
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function KenarCubugu({
  oturum,
  bekleyenTalep,
  yol,
  dar,
  daralt,
}: {
  oturum: OturumBilgisi;
  bekleyenTalep: number;
  yol: string;
  dar: boolean;
  daralt?: () => void;
}) {
  const etkin = etkinSatir(yol)?.yol;
  const hesapta = yol === "/admin/hesap" || yol.startsWith("/admin/hesap/");

  return (
    <>
      <div className={cn("border-b border-cizgi", dar ? "flex justify-center px-2 py-4" : "px-5 py-4")}>
        <Link href="/admin" title={dar ? "Boztepe Yönetim" : undefined}>
          {dar ? (
            <MarkaIsareti className="h-7" />
          ) : (
            <span className="block">
              <MarkaLogosu className="h-9" />
              <span className="mt-1 block text-[0.65rem] font-medium uppercase tracking-[0.2em] text-kiremit">Yönetim paneli</span>
            </span>
          )}
        </Link>
      </div>

      <nav aria-label="Ana menü" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2">
        {MENU.map((grup, i) => (
          <div key={grup.ad} role="group" aria-label={grup.ad} className={i > 0 ? "mt-2" : undefined}>
            {dar ? (
              i > 0 && <div className="mx-3 mb-1 border-t border-cizgi" aria-hidden />
            ) : (
              <p className="px-5 pb-1 pt-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-solgun">{grup.ad}</p>
            )}
            <ul className={dar ? "px-2" : "px-3"}>
              {grup.satirlar.map((s) => {
                const Simge = s.simge;
                const acik = etkin === s.yol;
                const rozet = s.rozet === "talep" && bekleyenTalep > 0 ? bekleyenTalep : 0;
                return (
                  <li key={s.yol}>
                    <Link
                      href={s.yol}
                      aria-current={acik ? "page" : undefined}
                      title={dar ? (rozet ? `${s.ad} · ${rozet} bekleyen` : s.ad) : undefined}
                      className={cn(
                        "relative flex items-center rounded-yumusak text-sm transition-colors",
                        dar ? "justify-center py-2.5" : "gap-3 px-3 py-2",
                        acik ? "bg-kiremit text-white" : "text-murekkep-yumusak hover:bg-kum-koyu hover:text-murekkep",
                      )}
                    >
                      <Simge className="size-4 shrink-0" />
                      <span className={dar ? "sr-only" : "flex-1 truncate"}>{s.ad}</span>
                      {rozet > 0 &&
                        (dar ? (
                          <span className="absolute right-2 top-1.5 size-2 rounded-full bg-kiremit ring-2 ring-yuzey" aria-hidden />
                        ) : (
                          <span
                            className={cn(
                              "rakam rounded-full px-1.5 py-0.5 text-xs font-semibold",
                              acik ? "bg-white/25 text-white" : "bg-kiremit text-white",
                            )}
                          >
                            {rozet}
                          </span>
                        ))}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {daralt && (
        <button
          type="button"
          onClick={daralt}
          aria-expanded={!dar}
          title={dar ? "Menüyü genişlet" : "Menüyü daralt"}
          className={cn(
            "flex items-center gap-3 border-t border-cizgi py-2.5 text-sm text-murekkep-yumusak hover:bg-kum-koyu hover:text-murekkep",
            dar ? "justify-center" : "px-5",
          )}
        >
          {dar ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          <span className={dar ? "sr-only" : undefined}>{dar ? "Menüyü genişlet" : "Menüyü daralt"}</span>
        </button>
      )}

      <div className={cn("border-t border-cizgi", dar ? "flex flex-col items-center gap-2 py-3" : "px-4 py-3")}>
        {dar ? (
          <>
            <Link
              href="/admin/hesap"
              title={`${oturum.adSoyad} · Hesabım`}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                hesapta ? "bg-kiremit text-white" : "bg-kum-koyu text-murekkep",
              )}
            >
              {oturum.adSoyad.charAt(0).toLocaleUpperCase("tr")}
            </Link>
            <form action={cikisYap}>
              <button type="submit" title="Çıkış yap" className="rounded-yumusak p-2 text-murekkep-yumusak hover:bg-hata/10 hover:text-hata">
                <LogOut className="size-4" />
                <span className="sr-only">Çıkış yap</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/admin/hesap"
              title={oturum.eposta}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3 rounded-yumusak px-1 py-1",
                hesapta ? "text-kiremit" : "hover:text-kiremit",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  hesapta ? "bg-kiremit text-white" : "bg-kum-koyu text-murekkep",
                )}
              >
                {oturum.adSoyad.charAt(0).toLocaleUpperCase("tr")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-murekkep">{oturum.adSoyad}</span>
                <span className="block text-xs text-solgun">Hesabım</span>
              </span>
            </Link>
            <form action={cikisYap}>
              <button
                type="submit"
                title="Çıkış yap"
                className="rounded-yumusak p-2 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata"
              >
                <LogOut className="size-4" />
                <span className="sr-only">Çıkış yap</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
