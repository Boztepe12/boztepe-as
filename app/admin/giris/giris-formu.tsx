"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";
import { AlertCircle, LogIn } from "lucide-react";

import { Buton } from "@/components/ui/buton";
import { Alan, Girdi } from "@/components/ui/form";
import { girisYap, type GirisSonucu } from "@/lib/auth/giris";

export function GirisFormu() {
  const router = useRouter();
  const parametreler = useSearchParams();
  const [durum, eylem, bekliyor] = useActionState<GirisSonucu | null, FormData>(
    girisYap,
    null,
  );

  /*
   * Yönlendirmeyi sunucu eylemi içinde değil burada yapıyoruz: kullanıcı korumalı bir
   * sayfadan geldiyse girişten sonra oraya dönmesi gerekiyor ve o adres `?donus=`
   * parametresinde taşınıyor.
   */
  useEffect(() => {
    if (durum?.durum === "basarili") {
      const donus = parametreler.get("donus");
      const hedef = donus?.startsWith("/admin") ? donus : "/admin";
      router.replace(hedef);
      router.refresh();
    }
  }, [durum, router, parametreler]);

  return (
    <form action={eylem} className="space-y-4">
      {durum?.durum === "hata" && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-yumusak border border-hata/30 bg-hata/8 p-3.5 text-sm text-hata"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{durum.mesaj}</span>
        </div>
      )}

      <Alan etiket="E-posta" zorunlu>
        <Girdi
          name="eposta"
          type="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="ornek@boztepeas.com"
        />
      </Alan>

      <Alan etiket="Şifre" zorunlu>
        <Girdi
          name="sifre"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Alan>

      <Buton type="submit" tamGenislik boyut="buyuk" disabled={bekliyor}>
        <LogIn className="size-4" />
        {bekliyor ? "Giriş yapılıyor…" : "Giriş yap"}
      </Buton>
    </form>
  );
}
