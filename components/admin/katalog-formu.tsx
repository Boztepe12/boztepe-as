"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Save } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton, ButonBaglanti } from "@/components/ui/buton";
import { Alan, AlanIzgarasi, Girdi, MetinKutusu, Onay, Secim } from "@/components/ui/form";
import { kategoriKaydet, markaKaydet } from "@/lib/eylemler/admin/katalog";

export type KatalogKaydi = {
  id: number;
  ad: string;
  slug: string;
  aciklama: string | null;
  sira: number;
  aktif: boolean;
  /* Yalnızca kategoride kullanılır. */
  ustKategoriId?: number | null;
  anaSayfadaGoster?: boolean;
  seoBaslik?: string | null;
  seoAciklama?: string | null;
};

type FormDegeri = {
  ad: string;
  slug: string;
  aciklama: string;
  sira: string;
  aktif: boolean;
  ustKategoriId: string;
  anaSayfadaGoster: boolean;
  seoBaslik: string;
  seoAciklama: string;
};

export function KatalogFormu({
  tur,
  kayit,
  ustSecenekleri = [],
}: {
  tur: "kategori" | "marka";
  kayit?: KatalogKaydi;
  /** Kategori formunda üst kategori listesi; markada boş geçilir. */
  ustSecenekleri?: { id: number; etiket: string }[];
}) {
  const router = useRouter();
  const [deger, setDeger] = useState<FormDegeri>({
    ad: kayit?.ad ?? "",
    slug: kayit?.slug ?? "",
    aciklama: kayit?.aciklama ?? "",
    sira: String(kayit?.sira ?? 0),
    aktif: kayit?.aktif ?? true,
    ustKategoriId: kayit?.ustKategoriId ? String(kayit.ustKategoriId) : "",
    anaSayfadaGoster: kayit?.anaSayfadaGoster ?? false,
    seoBaslik: kayit?.seoBaslik ?? "",
    seoAciklama: kayit?.seoAciklama ?? "",
  });
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [kaydediliyor, basla] = useTransition();

  const kategoriMi = tur === "kategori";
  const listeYolu = kategoriMi ? "/admin/kategoriler" : "/admin/markalar";
  const vitrinYolu = kategoriMi ? "/kategori" : "/marka";

  function guncelle<T extends keyof FormDegeri>(alan: T, yeni: FormDegeri[T]) {
    setDeger((onceki) => ({ ...onceki, [alan]: yeni }));
    if (hatalar[alan]) {
      setHatalar((onceki) => {
        const kalan = { ...onceki };
        delete kalan[alan as string];
        return kalan;
      });
    }
  }

  function kaydet() {
    basla(async () => {
      try {
        const ortak = {
          id: kayit?.id,
          ad: deger.ad,
          slug: deger.slug,
          aciklama: deger.aciklama,
          sira: deger.sira,
          aktif: deger.aktif,
        };

        const sonuc = kategoriMi
          ? await kategoriKaydet({
              ...ortak,
              ustKategoriId: deger.ustKategoriId,
              anaSayfadaGoster: deger.anaSayfadaGoster,
              seoBaslik: deger.seoBaslik,
              seoAciklama: deger.seoAciklama,
            })
          : await markaKaydet(ortak);

        if (sonuc.durum === "hata") {
          setHatalar(sonuc.alanlar ?? {});
          toast.error(sonuc.mesaj);
          return;
        }

        setHatalar({});
        toast.success(sonuc.mesaj ?? "Kaydedildi.");

        if (kayit) router.refresh();
        else if (sonuc.id) router.push(`${listeYolu}/${sonuc.id}`);
      } catch {
        toast.error("Kaydedilemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyip deneyin.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Panel baslik="Bilgiler">
        <div className="space-y-4 p-5">
          <Alan
            etiket={kategoriMi ? "Kategori adı" : "Marka adı"}
            zorunlu
            hata={hatalar.ad}
          >
            <Girdi
              value={deger.ad}
              onChange={(olay) => guncelle("ad", olay.target.value)}
              placeholder={kategoriMi ? "Örn. Çamaşır Makinesi" : "Örn. Vestel"}
              aria-invalid={Boolean(hatalar.ad)}
              autoFocus={!kayit}
            />
          </Alan>

          {kategoriMi && (
            <Alan
              etiket="Üst kategori"
              ipucu="Boş bırakılırsa ana menüde üst seviye kategori olur."
              hata={hatalar.ustKategoriId}
            >
              <Secim
                value={deger.ustKategoriId}
                onChange={(olay) => guncelle("ustKategoriId", olay.target.value)}
              >
                <option value="">Üst seviye kategori</option>
                {ustSecenekleri.map((secenek) => (
                  <option key={secenek.id} value={secenek.id}>
                    {secenek.etiket}
                  </option>
                ))}
              </Secim>
            </Alan>
          )}

          <Alan etiket="Açıklama" hata={hatalar.aciklama}>
            <MetinKutusu
              value={deger.aciklama}
              onChange={(olay) => guncelle("aciklama", olay.target.value)}
              rows={3}
              placeholder={
                kategoriMi
                  ? "Kategori sayfasının üstünde görünen kısa tanıtım."
                  : "Marka sayfasında görünen kısa tanıtım."
              }
            />
          </Alan>

          <AlanIzgarasi>
            <Alan etiket="Sıra" ipucu="Küçük sayı önce görünür.">
              <Girdi
                value={deger.sira}
                onChange={(olay) => guncelle("sira", olay.target.value)}
                inputMode="numeric"
                className="rakam"
              />
            </Alan>

            <Alan
              etiket="Sayfa adresi"
              ipucu={
                deger.slug
                  ? `boztepeas.com${vitrinYolu}/${deger.slug}`
                  : "Boş bırakılırsa addan üretilir."
              }
              hata={hatalar.slug}
            >
              <Girdi
                value={deger.slug}
                onChange={(olay) => guncelle("slug", olay.target.value)}
                placeholder={kategoriMi ? "camasir-makinesi" : "vestel"}
              />
            </Alan>
          </AlanIzgarasi>

          <div className="space-y-3">
            <Onay
              checked={deger.aktif}
              onChange={(olay) => guncelle("aktif", olay.target.checked)}
              etiket={
                <span>
                  Sitede yayında
                  <span className="mt-0.5 block text-xs text-solgun">
                    Kapalıyken menüde ve listelerde görünmez.
                  </span>
                </span>
              }
            />
            {kategoriMi && (
              <Onay
                checked={deger.anaSayfadaGoster}
                onChange={(olay) => guncelle("anaSayfadaGoster", olay.target.checked)}
                etiket="Ana sayfadaki kategori kartlarında göster"
              />
            )}
          </div>
        </div>
      </Panel>

      {kategoriMi && (
        <details className="rounded-kart border border-cizgi bg-yuzey">
          <summary className="cursor-pointer select-none px-5 py-4 font-govde font-semibold text-murekkep">
            Arama motoru ayarları
            <span className="ml-2 text-sm font-normal text-solgun">(isteğe bağlı)</span>
          </summary>
          <div className="space-y-4 border-t border-cizgi p-5">
            <Alan etiket="Google başlığı" ipucu="Boş bırakılırsa kategori adı kullanılır.">
              <Girdi
                value={deger.seoBaslik}
                onChange={(olay) => guncelle("seoBaslik", olay.target.value)}
              />
            </Alan>
            <Alan etiket="Google açıklaması">
              <MetinKutusu
                value={deger.seoAciklama}
                onChange={(olay) => guncelle("seoAciklama", olay.target.value)}
                rows={3}
              />
            </Alan>
          </div>
        </details>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {kayit && (
          <Link
            href={`${vitrinYolu}/${kayit.slug}`}
            target="_blank"
            className="mr-auto flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit"
          >
            <ExternalLink className="size-3.5" />
            Sitede gör
          </Link>
        )}
        <ButonBaglanti href={listeYolu} gorunum="sessiz">
          Vazgeç
        </ButonBaglanti>
        <Buton type="button" onClick={kaydet} disabled={kaydediliyor}>
          <Save className="size-4" />
          {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
        </Buton>
      </div>
    </div>
  );
}
