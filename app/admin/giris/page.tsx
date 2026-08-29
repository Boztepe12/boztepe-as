import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { mevcutOturum } from "@/lib/auth/oturum";

import { GirisFormu } from "./giris-formu";

export const metadata: Metadata = {
  title: "Yönetici Girişi",
  robots: { index: false, follow: false },
};

export default async function GirisSayfasi() {
  /* Zaten giriş yapmış biri giriş ekranını görmemeli. */
  const oturum = await mevcutOturum();
  if (oturum) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-kum px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="font-baslik text-3xl tracking-tight text-murekkep">BOZTEPE</span>
            <span className="ml-1.5 text-xs font-medium uppercase tracking-[0.2em] text-kiremit">
              A.Ş.
            </span>
          </Link>
          <p className="mt-2 text-sm text-murekkep-yumusak">Yönetim paneli</p>
        </div>

        <div className="rounded-panel border border-cizgi bg-yuzey p-6 shadow-kart sm:p-7">
          <Suspense fallback={<div className="iskelet h-64 rounded-kart" />}>
            <GirisFormu />
          </Suspense>
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit"
        >
          <ArrowLeft className="size-3.5" />
          Siteye dön
        </Link>
      </div>
    </div>
  );
}
