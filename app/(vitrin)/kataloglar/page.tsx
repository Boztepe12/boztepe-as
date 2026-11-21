import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, ExternalLink, FileText } from "lucide-react";

import { EkmekKirintisi } from "@/components/site/ekmek-kirintisi";
import { ButonBaglanti } from "@/components/ui/buton";
import { BosDurum } from "@/components/ui/durum";
import { kataloglarSayfasi } from "@/lib/sorgular/icerik";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kataloglar",
  description: "Boztepe A.Ş.'de satılan markaların güncel katalogları: mobilya, beyaz eşya ve halı.",
  alternates: { canonical: "/kataloglar" },
};

function boyut(bayt: number | null): string {
  if (!bayt) return "";
  return bayt >= 1024 * 1024 ? `${(bayt / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bayt / 1024))} KB`;
}

function alanAdi(adres: string): string {
  try {
    return new URL(adres).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default async function KataloglarSayfasi() {
  const gruplar = await kataloglarSayfasi();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <EkmekKirintisi adimlar={[{ ad: "Kataloglar" }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="font-baslik text-3xl leading-tight text-murekkep sm:text-4xl">Kataloglar</h1>
        <p className="mt-3 leading-relaxed text-murekkep-yumusak">
          Mağazamızda satılan markaların güncel katalogları. Beğendiğiniz ürünü WhatsApp&apos;tan ya da telefonla sorabilirsiniz.
        </p>
      </header>

      {gruplar.length === 0 ? (
        <BosDurum
          simge={<BookOpen className="size-10" />}
          baslik="Kataloglar yakında"
          aciklama="Markaların kataloglarını yakında buraya ekleyeceğiz."
          eylem={<ButonBaglanti href="/urunler">Ürünlere göz at</ButonBaglanti>}
        />
      ) : (
        <div className="space-y-12">
          {gruplar.map((g) => (
            <section key={g.grup} aria-labelledby={`grup-${g.grup}`}>
              <h2 id={`grup-${g.grup}`} className="mb-5 font-baslik text-2xl text-murekkep">
                {g.grup}
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.kataloglar.map((k) => {
                  const pdf = k.tur === "pdf";
                  return (
                    <li key={k.id}>
                      <a
                        href={k.baglanti}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full flex-col overflow-hidden rounded-kart border border-cizgi bg-yuzey transition-shadow hover:shadow-md"
                      >
                        <div className="relative aspect-[4/3] bg-kum">
                          {k.kapakUrl ? (
                            <Image
                              src={k.kapakUrl}
                              alt={k.baslik}
                              fill
                              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-contain p-6 transition-transform group-hover:scale-[1.03]"
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center font-baslik text-3xl text-murekkep-yumusak">
                              {k.baslik}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 border-t border-cizgi p-4">
                          <h3 className="font-govde font-semibold text-murekkep">{k.baslik}</h3>
                          {k.aciklama && <p className="text-sm text-murekkep-yumusak">{k.aciklama}</p>}
                          <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-kiremit">
                            {pdf ? <FileText className="size-4" /> : <ExternalLink className="size-4" />}
                            {pdf ? "Kataloğu aç (PDF)" : "Online katalog"}
                            <span className="rakam text-xs font-normal text-solgun">
                              {pdf ? boyut(k.dosyaBoyutu) : alanAdi(k.baglanti)}
                            </span>
                          </span>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
