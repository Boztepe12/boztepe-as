import type { Metadata } from "next";

import { HesapFormlari } from "@/components/admin/hesap-formlari";
import { SayfaBasligi } from "@/components/admin/panel-parcalari";
import { oturumZorunlu } from "@/lib/auth/koruma";

export const metadata: Metadata = { title: "Hesabım" };

export default async function HesapSayfasi() {
  const oturum = await oturumZorunlu();

  return (
    <div className="mx-auto max-w-3xl">
      <SayfaBasligi
        baslik="Hesabım"
        aciklama="Giriş bilgilerinizi buradan değiştirirsiniz."
      />

      <HesapFormlari adSoyad={oturum.adSoyad} eposta={oturum.eposta} rol={oturum.rol} />
    </div>
  );
}
