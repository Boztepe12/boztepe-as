"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Save } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { Alan, AlanIzgarasi, Girdi } from "@/components/ui/form";
import { profilGuncelle, sifreDegistir } from "@/lib/eylemler/admin/ayarlar";

export function HesapFormlari({
  adSoyad,
  eposta,
  rol,
}: {
  adSoyad: string;
  eposta: string;
  rol: string;
}) {
  const router = useRouter();

  const [profil, setProfil] = useState({ adSoyad, eposta });
  const [profilHatalari, setProfilHatalari] = useState<Record<string, string>>({});
  const [profilKaydediliyor, profilBasla] = useTransition();

  const [sifre, setSifre] = useState({ mevcut: "", yeni: "", yeniTekrar: "" });
  const [sifreHatalari, setSifreHatalari] = useState<Record<string, string>>({});
  const [sifreKaydediliyor, sifreBasla] = useTransition();

  function profiliKaydet() {
    profilBasla(async () => {
      try {
        const sonuc = await profilGuncelle(profil);
        if (sonuc.durum === "hata") {
          setProfilHatalari(sonuc.alanlar ?? {});
          toast.error(sonuc.mesaj);
          return;
        }
        setProfilHatalari({});
        toast.success(sonuc.mesaj ?? "Kaydedildi.");
        router.refresh();
      } catch {
        toast.error("Kaydedilemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyip deneyin.");
      }
    });
  }

  function sifreyiDegistir() {
    sifreBasla(async () => {
      try {
        const sonuc = await sifreDegistir(sifre);
        if (sonuc.durum === "hata") {
          setSifreHatalari(sonuc.alanlar ?? {});
          toast.error(sonuc.mesaj);
          return;
        }
        setSifreHatalari({});
        /* Yeni şifre ekranda kalmasın. */
        setSifre({ mevcut: "", yeni: "", yeniTekrar: "" });
        toast.success(sonuc.mesaj ?? "Şifreniz değiştirildi.");
      } catch {
        toast.error("Değiştirilemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyip deneyin.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Panel
        baslik="Hesap bilgileri"
        aciklama={`Yetki düzeyiniz: ${rol === "admin" ? "Yönetici" : "Editör"}`}
        eylem={
          <Buton type="button" boyut="kucuk" onClick={profiliKaydet} disabled={profilKaydediliyor}>
            <Save className="size-4" />
            {profilKaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </Buton>
        }
      >
        <div className="space-y-4 p-5">
          <AlanIzgarasi>
            <Alan etiket="Ad soyad" zorunlu hata={profilHatalari.adSoyad}>
              <Girdi
                value={profil.adSoyad}
                onChange={(olay) => setProfil((o) => ({ ...o, adSoyad: olay.target.value }))}
                autoComplete="name"
                aria-invalid={Boolean(profilHatalari.adSoyad)}
              />
            </Alan>

            <Alan
              etiket="E-posta"
              zorunlu
              ipucu="Panele bu adresle giriş yaparsınız."
              hata={profilHatalari.eposta}
            >
              <Girdi
                type="email"
                value={profil.eposta}
                onChange={(olay) => setProfil((o) => ({ ...o, eposta: olay.target.value }))}
                autoComplete="username"
                aria-invalid={Boolean(profilHatalari.eposta)}
              />
            </Alan>
          </AlanIzgarasi>
        </div>
      </Panel>

      <Panel
        baslik="Şifre değiştir"
        aciklama="Şifre en az 10 karakter olmalı ve bir rakam içermeli."
        eylem={
          <Buton
            type="button"
            boyut="kucuk"
            onClick={sifreyiDegistir}
            disabled={sifreKaydediliyor}
          >
            <KeyRound className="size-4" />
            {sifreKaydediliyor ? "Değiştiriliyor…" : "Şifreyi değiştir"}
          </Buton>
        }
      >
        <div className="space-y-4 p-5">
          <Alan etiket="Mevcut şifre" zorunlu hata={sifreHatalari.mevcut}>
            <Girdi
              type="password"
              value={sifre.mevcut}
              onChange={(olay) => setSifre((o) => ({ ...o, mevcut: olay.target.value }))}
              autoComplete="current-password"
              aria-invalid={Boolean(sifreHatalari.mevcut)}
            />
          </Alan>

          <AlanIzgarasi>
            <Alan etiket="Yeni şifre" zorunlu hata={sifreHatalari.yeni}>
              <Girdi
                type="password"
                value={sifre.yeni}
                onChange={(olay) => setSifre((o) => ({ ...o, yeni: olay.target.value }))}
                autoComplete="new-password"
                aria-invalid={Boolean(sifreHatalari.yeni)}
              />
            </Alan>

            <Alan etiket="Yeni şifre (tekrar)" zorunlu hata={sifreHatalari.yeniTekrar}>
              <Girdi
                type="password"
                value={sifre.yeniTekrar}
                onChange={(olay) => setSifre((o) => ({ ...o, yeniTekrar: olay.target.value }))}
                autoComplete="new-password"
                aria-invalid={Boolean(sifreHatalari.yeniTekrar)}
              />
            </Alan>
          </AlanIzgarasi>
        </div>
      </Panel>
    </div>
  );
}
