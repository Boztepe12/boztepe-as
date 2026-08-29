"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Landmark,
  Settings,
  Tags,
  Inbox,
  UserCog,
  X,
} from "lucide-react";

import { cikisYap } from "@/lib/auth/giris";
import type { OturumBilgisi } from "@/lib/auth/oturum";
import { cn } from "@/lib/utils";

const MENU = [
  { ad: "Özet", yol: "/admin", simge: LayoutDashboard, tam: true },
  { ad: "Ürünler", yol: "/admin/urunler", simge: Package },
  { ad: "Talepler", yol: "/admin/talepler", simge: Inbox },
  { ad: "Kategoriler", yol: "/admin/kategoriler", simge: Tags },
  { ad: "Markalar", yol: "/admin/markalar", simge: Tags },
  { ad: "Afişler", yol: "/admin/afisler", simge: ImageIcon },
  { ad: "Galeri", yol: "/admin/galeri", simge: Images },
  { ad: "Banka Hesapları", yol: "/admin/banka", simge: Landmark },
  { ad: "Site Ayarları", yol: "/admin/ayarlar", simge: Settings },
  { ad: "Hesabım", yol: "/admin/hesap", simge: UserCog },
];

export function PanelKabuk({
  oturum,
  bekleyenTalep,
  children,
}: {
  oturum: OturumBilgisi;
  bekleyenTalep: number;
  children: React.ReactNode;
}) {
  const yol = usePathname();
  const [mobilAcik, setMobilAcik] = useState(false);

  function etkinMi(madde: (typeof MENU)[number]) {
    return madde.tam ? yol === madde.yol : yol.startsWith(madde.yol);
  }

  const menu = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {MENU.map((madde) => {
        const Simge = madde.simge;
        const etkin = etkinMi(madde);

        return (
          <Link
            key={madde.yol}
            href={madde.yol}
            onClick={() => setMobilAcik(false)}
            className={cn(
              "flex items-center gap-3 rounded-yumusak px-3 py-2.5 text-sm transition-colors",
              etkin
                ? "bg-kiremit text-white"
                : "text-murekkep-yumusak hover:bg-kum-koyu hover:text-murekkep",
            )}
          >
            <Simge className="size-4 shrink-0" />
            <span className="flex-1">{madde.ad}</span>
            {madde.yol === "/admin/talepler" && bekleyenTalep > 0 && (
              <span
                className={cn(
                  "rakam rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  etkin ? "bg-white/25 text-white" : "bg-kiremit text-white",
                )}
              >
                {bekleyenTalep}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const altBolum = (
    <div className="border-t border-cizgi p-3">
      <div className="mb-2 px-3 py-2">
        <p className="truncate text-sm font-medium text-murekkep">{oturum.adSoyad}</p>
        <p className="truncate text-xs text-solgun">{oturum.eposta}</p>
      </div>
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-yumusak px-3 py-2.5 text-sm text-murekkep-yumusak hover:bg-kum-koyu hover:text-murekkep"
      >
        <ExternalLink className="size-4" />
        Siteyi görüntüle
      </Link>
      <form action={cikisYap}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-yumusak px-3 py-2.5 text-sm text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata"
        >
          <LogOut className="size-4" />
          Çıkış yap
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-kum">
      {/* Masaüstü kenar çubuğu */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-cizgi bg-yuzey lg:flex">
        <div className="border-b border-cizgi px-5 py-4">
          <Link href="/admin">
            <span className="font-baslik text-xl tracking-tight text-murekkep">BOZTEPE</span>
            <span className="ml-1.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-kiremit">
              Yönetim
            </span>
          </Link>
        </div>
        {menu}
        {altBolum}
      </aside>

      {/* Mobil çekmece */}
      {mobilAcik && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-murekkep/40"
            onClick={() => setMobilAcik(false)}
            aria-label="Menüyü kapat"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-yuzey shadow-panel">
            <div className="flex items-center justify-between border-b border-cizgi px-5 py-4">
              <span className="font-baslik text-xl text-murekkep">BOZTEPE</span>
              <button
                type="button"
                onClick={() => setMobilAcik(false)}
                className="rounded-yumusak p-2 text-murekkep hover:bg-kum-koyu"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            {menu}
            {altBolum}
          </div>
        </div>
      )}

      {/* İçerik */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-cizgi bg-yuzey px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobilAcik(true)}
            className="rounded-yumusak p-2 text-murekkep hover:bg-kum-koyu"
            aria-label="Menüyü aç"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-baslik text-lg text-murekkep">Yönetim</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
