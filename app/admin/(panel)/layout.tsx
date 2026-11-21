import type { Metadata } from "next";
import { cookies } from "next/headers";

import { PanelKabuk } from "@/components/admin/panel-kabuk";
import { MENU_CEREZI } from "@/lib/admin-menu";
import { oturumZorunlu } from "@/lib/auth/koruma";
import { bekleyenTalepSayisi } from "@/lib/sorgular/admin";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s — Boztepe Yönetim" },
  robots: { index: false, follow: false },
};

/* Yönetim ekranları her zaman güncel veriyi göstermeli, önbelleğe alınmamalı. */
export const dynamic = "force-dynamic";

export default async function PanelYerlesimi({ children }: { children: React.ReactNode }) {
  const oturum = await oturumZorunlu();
  const [bekleyen, cerezler] = await Promise.all([bekleyenTalepSayisi(), cookies()]);

  return (
    <PanelKabuk oturum={oturum} bekleyenTalep={bekleyen} dar={cerezler.get(MENU_CEREZI)?.value === "dar"}>
      {children}
    </PanelKabuk>
  );
}
