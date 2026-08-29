"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton, ButonBaglanti } from "@/components/ui/buton";
import { Alan, AlanIzgarasi, Girdi, MetinKutusu, Onay, Secim } from "@/components/ui/form";
import { urunKaydet } from "@/lib/eylemler/admin/urun";

export type FormUrunu = {
  id: number;
  ad: string;
  slug: string;
  stokKodu: string | null;
  kategoriId: number | null;
  markaId: number | null;
  kisaAciklama: string | null;
  aciklama: string | null;
  fiyat: string | null;
  indirimliFiyat: string | null;
  fiyatGizli: boolean;
  taksitSayisi: number | null;
  garantiSuresi: string | null;
  stokDurumu: "stokta" | "tukendi" | "siparise_bagli";
  oneCikan: boolean;
  yeniUrun: boolean;
  aktif: boolean;
  sira: number;
  seoBaslik: string | null;
  seoAciklama: string | null;
};

export type FormOzelligi = { ad: string; deger: string };

type FormSecenekleri = {
  kategoriler: { id: number; etiket: string; altMi: boolean }[];
  markalar: { id: number; ad: string }[];
};

/**
 * Veritabanı parayı `numeric` tuttuğu için değer "24999.00" gibi gelir. Formda
 * Türkçe yazım bekleniyor (binlik nokta, kuruş virgül), bu yüzden gösterirken
 * gereksiz kuruşu atıyor, varsa ondalığı virgüle çeviriyoruz.
 */
function paraGoster(deger: string | null): string {
  if (!deger) return "";
  const sayi = Number(deger);
  if (!Number.isFinite(sayi)) return "";
  return sayi % 1 === 0 ? String(sayi) : String(sayi).replace(".", ",");
}

const BOS: FormDegeri = {
  ad: "",
  slug: "",
  stokKodu: "",
  kategoriId: "",
  markaId: "",
  kisaAciklama: "",
  aciklama: "",
  fiyat: "",
  indirimliFiyat: "",
  fiyatGizli: false,
  taksitSayisi: "",
  garantiSuresi: "",
  stokDurumu: "stokta",
  oneCikan: false,
  yeniUrun: false,
  aktif: true,
  sira: "0",
  seoBaslik: "",
  seoAciklama: "",
};

type FormDegeri = {
  ad: string;
  slug: string;
  stokKodu: string;
  kategoriId: string;
  markaId: string;
  kisaAciklama: string;
  aciklama: string;
  fiyat: string;
  indirimliFiyat: string;
  fiyatGizli: boolean;
  taksitSayisi: string;
  garantiSuresi: string;
  stokDurumu: "stokta" | "tukendi" | "siparise_bagli";
  oneCikan: boolean;
  yeniUrun: boolean;
  aktif: boolean;
  sira: string;
  seoBaslik: string;
  seoAciklama: string;
};

function baslangicDegeri(urun?: FormUrunu): FormDegeri {
  if (!urun) return BOS;

  return {
    ad: urun.ad,
    slug: urun.slug,
    stokKodu: urun.stokKodu ?? "",
    kategoriId: urun.kategoriId ? String(urun.kategoriId) : "",
    markaId: urun.markaId ? String(urun.markaId) : "",
    kisaAciklama: urun.kisaAciklama ?? "",
    aciklama: urun.aciklama ?? "",
    fiyat: paraGoster(urun.fiyat),
    indirimliFiyat: paraGoster(urun.indirimliFiyat),
    fiyatGizli: urun.fiyatGizli,
    taksitSayisi: urun.taksitSayisi ? String(urun.taksitSayisi) : "",
    garantiSuresi: urun.garantiSuresi ?? "",
    stokDurumu: urun.stokDurumu,
    oneCikan: urun.oneCikan,
    yeniUrun: urun.yeniUrun,
    aktif: urun.aktif,
    sira: String(urun.sira),
    seoBaslik: urun.seoBaslik ?? "",
    seoAciklama: urun.seoAciklama ?? "",
  };
}

export function UrunFormu({
  urun,
  ozellikler: baslangicOzellikleri = [],
  secenekler,
}: {
  urun?: FormUrunu;
  ozellikler?: FormOzelligi[];
  secenekler: FormSecenekleri;
}) {
  const router = useRouter();
  const [deger, setDeger] = useState<FormDegeri>(() => baslangicDegeri(urun));
  const [ozellikler, setOzellikler] = useState<FormOzelligi[]>(baslangicOzellikleri);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [kaydediliyor, basla] = useTransition();

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

  function ozellikGuncelle(sira: number, alan: keyof FormOzelligi, yeni: string) {
    setOzellikler((onceki) =>
      onceki.map((ozellik, indeks) =>
        indeks === sira ? { ...ozellik, [alan]: yeni } : ozellik,
      ),
    );
  }

  function kaydet() {
    /* Yarım kalmış özellik satırı sessizce atılırsa yönetici veri kaybettiğini fark etmez. */
    const dolu = ozellikler.filter((ozellik) => ozellik.ad.trim() || ozellik.deger.trim());
    const yarim = dolu.some((ozellik) => !ozellik.ad.trim() || !ozellik.deger.trim());

    if (yarim) {
      toast.error("Teknik özelliklerde hem başlık hem değer dolu olmalı.");
      return;
    }

    basla(async () => {
      try {
        const sonuc = await urunKaydet({
          id: urun?.id,
          ...deger,
          ozellikler: dolu.map((ozellik) => ({
            ad: ozellik.ad.trim(),
            deger: ozellik.deger.trim(),
          })),
        });

        if (sonuc.durum === "hata") {
          setHatalar(sonuc.alanlar ?? {});
          toast.error(sonuc.mesaj);
          return;
        }

        setHatalar({});
        toast.success(sonuc.mesaj ?? "Kaydedildi.");

        if (urun) {
          router.refresh();
        } else if (sonuc.id) {
          /* Yeni üründe fotoğraf ancak kayıttan sonra eklenebildiği için düzenleme
             ekranına geçiyoruz; yönetici aynı akış içinde görselleri yükleyebilsin. */
          router.push(`/admin/urunler/${sonuc.id}`);
        }
      } catch {
        /* Eylem hiç dönmediyse (oturum düştü, ağ koptu) form açık kalmalı ki
           doldurulan bilgiler kaybolmasın. */
        toast.error("Kaydedilemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyip tekrar deneyin.");
      }
    });
  }

  return (
    <div className="space-y-5 pb-24">
      <Panel baslik="Temel bilgiler">
        <div className="space-y-4 p-5">
          <Alan etiket="Ürün adı" zorunlu hata={hatalar.ad}>
            <Girdi
              value={deger.ad}
              onChange={(olay) => guncelle("ad", olay.target.value)}
              placeholder="Örn. Vestel NFK540 X A++ Buzdolabı"
              aria-invalid={Boolean(hatalar.ad)}
              autoFocus={!urun}
            />
          </Alan>

          <AlanIzgarasi>
            <Alan etiket="Kategori" ipucu="Ürünün sitede hangi menüde görüneceğini belirler.">
              <Secim
                value={deger.kategoriId}
                onChange={(olay) => guncelle("kategoriId", olay.target.value)}
              >
                <option value="">Seçilmedi</option>
                {secenekler.kategoriler.map((kategori) => (
                  <option key={kategori.id} value={kategori.id}>
                    {kategori.etiket}
                  </option>
                ))}
              </Secim>
            </Alan>

            <Alan etiket="Marka">
              <Secim
                value={deger.markaId}
                onChange={(olay) => guncelle("markaId", olay.target.value)}
              >
                <option value="">Seçilmedi</option>
                {secenekler.markalar.map((marka) => (
                  <option key={marka.id} value={marka.id}>
                    {marka.ad}
                  </option>
                ))}
              </Secim>
            </Alan>
          </AlanIzgarasi>

          <AlanIzgarasi>
            <Alan etiket="Stok kodu" ipucu="Mağaza içi takip için; sitede görünmez." hata={hatalar.stokKodu}>
              <Girdi
                value={deger.stokKodu}
                onChange={(olay) => guncelle("stokKodu", olay.target.value)}
                placeholder="Örn. BYZ-1042"
                className="rakam"
              />
            </Alan>

            <Alan etiket="Sıra" ipucu="Küçük sayı listede daha önce çıkar.">
              <Girdi
                value={deger.sira}
                onChange={(olay) => guncelle("sira", olay.target.value)}
                inputMode="numeric"
                className="rakam"
              />
            </Alan>
          </AlanIzgarasi>

          <Alan
            etiket="Kısa açıklama"
            ipucu="Ürün kartlarında adın altında görünen tek cümle."
            hata={hatalar.kisaAciklama}
          >
            <MetinKutusu
              value={deger.kisaAciklama}
              onChange={(olay) => guncelle("kisaAciklama", olay.target.value)}
              rows={2}
              className="min-h-0"
              placeholder="Örn. 540 litre, No-Frost, çift kapılı"
            />
          </Alan>

          <Alan
            etiket="Açıklama"
            ipucu="Ürün sayfasındaki uzun metin. Boş bırakabilirsiniz."
            hata={hatalar.aciklama}
          >
            <MetinKutusu
              value={deger.aciklama}
              onChange={(olay) => guncelle("aciklama", olay.target.value)}
              rows={7}
              placeholder="Ürünün öne çıkan yanlarını, kullanım kolaylıklarını yazın."
            />
          </Alan>
        </div>
      </Panel>

      <Panel baslik="Fiyat ve stok" aciklama="Tutarları Türk Lirası olarak yazın: 24.999 veya 24999,90">
        <div className="space-y-4 p-5">
          <AlanIzgarasi>
            <Alan etiket="Fiyat" hata={hatalar.fiyat}>
              <Girdi
                value={deger.fiyat}
                onChange={(olay) => guncelle("fiyat", olay.target.value)}
                inputMode="decimal"
                placeholder="24.999"
                className="rakam"
                aria-invalid={Boolean(hatalar.fiyat)}
                disabled={deger.fiyatGizli}
              />
            </Alan>

            <Alan
              etiket="İndirimli fiyat"
              ipucu="Doldurursanız üründe indirim rozeti çıkar."
              hata={hatalar.indirimliFiyat}
            >
              <Girdi
                value={deger.indirimliFiyat}
                onChange={(olay) => guncelle("indirimliFiyat", olay.target.value)}
                inputMode="decimal"
                placeholder="21.499"
                className="rakam"
                aria-invalid={Boolean(hatalar.indirimliFiyat)}
                disabled={deger.fiyatGizli}
              />
            </Alan>
          </AlanIzgarasi>

          <Onay
            checked={deger.fiyatGizli}
            onChange={(olay) => guncelle("fiyatGizli", olay.target.checked)}
            etiket={
              <span>
                Fiyatı sitede gösterme
                <span className="mt-0.5 block text-xs text-solgun">
                  Fiyat yerine &quot;Fiyat için bize ulaşın&quot; yazar.
                </span>
              </span>
            }
          />

          <AlanIzgarasi>
            <Alan etiket="Taksit sayısı" ipucu="Boş bırakılırsa taksit bilgisi görünmez." hata={hatalar.taksitSayisi}>
              <Girdi
                value={deger.taksitSayisi}
                onChange={(olay) => guncelle("taksitSayisi", olay.target.value)}
                inputMode="numeric"
                placeholder="12"
                className="rakam"
              />
            </Alan>

            <Alan etiket="Garanti süresi" hata={hatalar.garantiSuresi}>
              <Girdi
                value={deger.garantiSuresi}
                onChange={(olay) => guncelle("garantiSuresi", olay.target.value)}
                placeholder="Örn. 3 yıl"
              />
            </Alan>
          </AlanIzgarasi>

          <Alan etiket="Stok durumu" className="sm:max-w-xs">
            <Secim
              value={deger.stokDurumu}
              onChange={(olay) =>
                guncelle("stokDurumu", olay.target.value as FormDegeri["stokDurumu"])
              }
            >
              <option value="stokta">Stokta</option>
              <option value="tukendi">Tükendi</option>
              <option value="siparise_bagli">Siparişe bağlı</option>
            </Secim>
          </Alan>
        </div>
      </Panel>

      <Panel baslik="Teknik özellikler" aciklama="Ürün sayfasında tablo olarak görünür.">
        <div className="space-y-3 p-5">
          {ozellikler.length === 0 && (
            <p className="text-sm text-murekkep-yumusak">
              Henüz özellik eklenmedi. Örneğin &quot;Enerji sınıfı — A++&quot; gibi satırlar
              ekleyebilirsiniz.
            </p>
          )}

          {ozellikler.map((ozellik, sira) => (
            <div key={sira} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
              <Girdi
                value={ozellik.ad}
                onChange={(olay) => ozellikGuncelle(sira, "ad", olay.target.value)}
                placeholder="Özellik (Enerji sınıfı)"
                aria-label={`${sira + 1}. özellik başlığı`}
                className="sm:w-1/3"
              />
              <Girdi
                value={ozellik.deger}
                onChange={(olay) => ozellikGuncelle(sira, "deger", olay.target.value)}
                placeholder="Değer (A++)"
                aria-label={`${sira + 1}. özellik değeri`}
                className="sm:flex-1"
              />
              <button
                type="button"
                onClick={() => setOzellikler((onceki) => onceki.filter((_, i) => i !== sira))}
                aria-label={`${sira + 1}. özelliği kaldır`}
                className="mt-0.5 rounded-yumusak p-2.5 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          {hatalar.ozellikler && <p className="text-sm text-hata">{hatalar.ozellikler}</p>}

          <Buton
            type="button"
            gorunum="ikincil"
            boyut="kucuk"
            onClick={() => setOzellikler((onceki) => [...onceki, { ad: "", deger: "" }])}
          >
            <Plus className="size-4" />
            Özellik ekle
          </Buton>
        </div>
      </Panel>

      <Panel baslik="Yayın">
        <div className="space-y-4 p-5">
          <Onay
            checked={deger.aktif}
            onChange={(olay) => guncelle("aktif", olay.target.checked)}
            etiket={
              <span>
                Sitede yayında
                <span className="mt-0.5 block text-xs text-solgun">
                  Kapalıyken ürün yalnızca yönetim panelinde görünür.
                </span>
              </span>
            }
          />
          <Onay
            checked={deger.oneCikan}
            onChange={(olay) => guncelle("oneCikan", olay.target.checked)}
            etiket="Ana sayfada öne çıkar"
          />
          <Onay
            checked={deger.yeniUrun}
            onChange={(olay) => guncelle("yeniUrun", olay.target.checked)}
            etiket="Yeni ürün rozeti göster"
          />

          <Alan
            etiket="Sayfa adresi"
            ipucu={
              deger.slug
                ? `boztepeas.com/urun/${deger.slug}`
                : "Boş bırakırsanız ürün adından otomatik üretilir."
            }
            hata={hatalar.slug}
          >
            <Girdi
              value={deger.slug}
              onChange={(olay) => guncelle("slug", olay.target.value)}
              placeholder="vestel-nfk540-x-buzdolabi"
            />
          </Alan>
        </div>
      </Panel>

      <details className="rounded-kart border border-cizgi bg-yuzey">
        <summary className="cursor-pointer select-none px-5 py-4 font-govde font-semibold text-murekkep">
          Arama motoru ayarları
          <span className="ml-2 text-sm font-normal text-solgun">(isteğe bağlı)</span>
        </summary>
        <div className="space-y-4 border-t border-cizgi p-5">
          <Alan
            etiket="Google başlığı"
            ipucu="Boş bırakılırsa ürün adı kullanılır."
            hata={hatalar.seoBaslik}
          >
            <Girdi
              value={deger.seoBaslik}
              onChange={(olay) => guncelle("seoBaslik", olay.target.value)}
              placeholder="Vestel NFK540 X Buzdolabı — Malatya"
            />
          </Alan>
          <Alan
            etiket="Google açıklaması"
            ipucu="Arama sonuçlarında görünen iki satırlık metin."
            hata={hatalar.seoAciklama}
          >
            <MetinKutusu
              value={deger.seoAciklama}
              onChange={(olay) => guncelle("seoAciklama", olay.target.value)}
              rows={3}
            />
          </Alan>
        </div>
      </details>

      {/* Kaydet çubuğu — uzun formda aşağı inildiğinde de erişilebilir kalsın diye sabit. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cizgi bg-yuzey/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-2">
          {urun && (
            <Link
              href={`/urun/${urun.slug}`}
              target="_blank"
              className="mr-auto flex items-center gap-1.5 text-sm text-murekkep-yumusak hover:text-kiremit"
            >
              <ExternalLink className="size-3.5" />
              Sitede gör
            </Link>
          )}
          <ButonBaglanti href="/admin/urunler" gorunum="sessiz">
            Vazgeç
          </ButonBaglanti>
          <Buton type="button" onClick={kaydet} disabled={kaydediliyor}>
            <Save className="size-4" />
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </Buton>
        </div>
      </div>
    </div>
  );
}
