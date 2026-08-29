"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton } from "@/components/ui/buton";
import { Alan, AlanIzgarasi, Girdi, MetinKutusu, Onay } from "@/components/ui/form";
import { ayarlariKaydet } from "@/lib/eylemler/admin/ayarlar";

export type Ayarlar = {
  iletisim: {
    firmaAdi: string;
    kisaAd: string;
    telefon: string;
    whatsapp: string;
    eposta: string;
    adres: string;
    haritaBaglantisi: string;
    calismaSaatleri: { gun: string; saat: string }[];
  };
  hakkimizda: {
    baslik: string;
    kurulusYili: number;
    ozet: string;
    paragraflar: string[];
    degerler: { baslik: string; metin: string }[];
  };
  duyuru: { aktif: boolean; metin: string; baglanti: string };
  sosyal: { facebook: string; instagram: string };
  seo: { baslik: string; aciklama: string };
};

/** Her bölüm kendi kaydet düğmesini taşıyor; tek dev form yerine küçük parçalar. */
function AyarBolumu<T>({
  anahtar,
  baslik,
  aciklama,
  baslangic,
  cocuklar,
}: {
  anahtar: string;
  baslik: string;
  aciklama?: string;
  baslangic: T;
  cocuklar: (
    deger: T,
    guncelle: (yeni: Partial<T>) => void,
    hatalar: Record<string, string>,
  ) => ReactNode;
}) {
  const router = useRouter();
  const [deger, setDeger] = useState<T>(baslangic);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [kaydediliyor, basla] = useTransition();

  function guncelle(yeni: Partial<T>) {
    setDeger((onceki) => ({ ...onceki, ...yeni }));
  }

  function kaydet() {
    basla(async () => {
      try {
        const sonuc = await ayarlariKaydet(anahtar, deger);
        if (sonuc.durum === "hata") {
          setHatalar(sonuc.alanlar ?? {});
          toast.error(sonuc.mesaj);
          return;
        }
        setHatalar({});
        toast.success(sonuc.mesaj ?? "Kaydedildi.");
        router.refresh();
      } catch {
        toast.error("Kaydedilemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyip deneyin.");
      }
    });
  }

  return (
    <Panel
      baslik={baslik}
      aciklama={aciklama}
      eylem={
        <Buton type="button" boyut="kucuk" onClick={kaydet} disabled={kaydediliyor}>
          <Save className="size-4" />
          {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
        </Buton>
      }
    >
      <div className="space-y-4 p-5">{cocuklar(deger, guncelle, hatalar)}</div>
    </Panel>
  );
}

export function AyarFormlari({ ayarlar }: { ayarlar: Ayarlar }) {
  return (
    <div className="space-y-5">
      <AyarBolumu
        anahtar="iletisim"
        baslik="İletişim bilgileri"
        aciklama="Başlıkta, altbilgide ve iletişim sayfasında görünür."
        baslangic={ayarlar.iletisim}
        cocuklar={(deger, guncelle, hatalar) => (
          <>
            <AlanIzgarasi>
              <Alan etiket="Firma unvanı" zorunlu hata={hatalar.firmaAdi}>
                <Girdi
                  value={deger.firmaAdi}
                  onChange={(olay) => guncelle({ firmaAdi: olay.target.value })}
                />
              </Alan>
              <Alan etiket="Kısa ad" ipucu="Logoda ve başlıklarda kullanılır." hata={hatalar.kisaAd}>
                <Girdi
                  value={deger.kisaAd}
                  onChange={(olay) => guncelle({ kisaAd: olay.target.value })}
                />
              </Alan>
            </AlanIzgarasi>

            <AlanIzgarasi>
              <Alan etiket="Telefon" hata={hatalar.telefon}>
                <Girdi
                  value={deger.telefon}
                  onChange={(olay) => guncelle({ telefon: olay.target.value })}
                  className="rakam"
                  placeholder="0422 321 20 36"
                />
              </Alan>
              <Alan etiket="WhatsApp" ipucu="Sipariş mesajları bu numaraya gider." hata={hatalar.whatsapp}>
                <Girdi
                  value={deger.whatsapp}
                  onChange={(olay) => guncelle({ whatsapp: olay.target.value })}
                  className="rakam"
                  placeholder="0507 464 12 74"
                />
              </Alan>
            </AlanIzgarasi>

            <Alan etiket="E-posta" hata={hatalar.eposta}>
              <Girdi
                type="email"
                value={deger.eposta}
                onChange={(olay) => guncelle({ eposta: olay.target.value })}
              />
            </Alan>

            <Alan etiket="Adres" hata={hatalar.adres}>
              <MetinKutusu
                value={deger.adres}
                onChange={(olay) => guncelle({ adres: olay.target.value })}
                rows={2}
                className="min-h-0"
              />
            </Alan>

            <Alan
              etiket="Google Haritalar bağlantısı"
              ipucu="Haritada aç düğmesi bu adrese gider."
              hata={hatalar.haritaBaglantisi}
            >
              <Girdi
                value={deger.haritaBaglantisi}
                onChange={(olay) => guncelle({ haritaBaglantisi: olay.target.value })}
                placeholder="https://maps.google.com/…"
              />
            </Alan>

            <div>
              <p className="mb-2 text-sm font-medium text-murekkep">Çalışma saatleri</p>
              <div className="space-y-2">
                {deger.calismaSaatleri.map((satir, sira) => (
                  <div key={sira} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                    <Girdi
                      value={satir.gun}
                      onChange={(olay) =>
                        guncelle({
                          calismaSaatleri: deger.calismaSaatleri.map((mevcut, i) =>
                            i === sira ? { ...mevcut, gun: olay.target.value } : mevcut,
                          ),
                        })
                      }
                      placeholder="Pazartesi - Cumartesi"
                      aria-label={`${sira + 1}. satır gün`}
                      className="sm:w-1/2"
                    />
                    <Girdi
                      value={satir.saat}
                      onChange={(olay) =>
                        guncelle({
                          calismaSaatleri: deger.calismaSaatleri.map((mevcut, i) =>
                            i === sira ? { ...mevcut, saat: olay.target.value } : mevcut,
                          ),
                        })
                      }
                      placeholder="09:00 - 19:00"
                      aria-label={`${sira + 1}. satır saat`}
                      className="sm:flex-1"
                    />
                    <button
                      type="button"
                      aria-label={`${sira + 1}. satırı kaldır`}
                      onClick={() =>
                        guncelle({
                          calismaSaatleri: deger.calismaSaatleri.filter((_, i) => i !== sira),
                        })
                      }
                      className="mt-0.5 rounded-yumusak p-2.5 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Buton
                type="button"
                gorunum="ikincil"
                boyut="kucuk"
                className="mt-2"
                onClick={() =>
                  guncelle({
                    calismaSaatleri: [...deger.calismaSaatleri, { gun: "", saat: "" }],
                  })
                }
              >
                <Plus className="size-4" />
                Satır ekle
              </Buton>
            </div>
          </>
        )}
      />

      <AyarBolumu
        anahtar="duyuru"
        baslik="Duyuru çubuğu"
        aciklama="Sitenin en üstünde ince bir şerit hâlinde görünür."
        baslangic={ayarlar.duyuru}
        cocuklar={(deger, guncelle, hatalar) => (
          <>
            <Onay
              checked={deger.aktif}
              onChange={(olay) => guncelle({ aktif: olay.target.checked })}
              etiket="Duyuru çubuğunu göster"
            />
            <Alan etiket="Duyuru metni" hata={hatalar.metin}>
              <Girdi
                value={deger.metin}
                onChange={(olay) => guncelle({ metin: olay.target.value })}
                placeholder="Örn. Seçili beyaz eşyada %30'a varan indirim"
              />
            </Alan>
            <Alan etiket="Bağlantı" ipucu="Boş bırakılırsa duyuru tıklanabilir olmaz.">
              <Girdi
                value={deger.baglanti}
                onChange={(olay) => guncelle({ baglanti: olay.target.value })}
                placeholder="/kampanyalar"
              />
            </Alan>
          </>
        )}
      />

      <AyarBolumu
        anahtar="sosyal"
        baslik="Sosyal medya"
        aciklama="Boş bırakılan hesabın simgesi sitede görünmez."
        baslangic={ayarlar.sosyal}
        cocuklar={(deger, guncelle) => (
          <AlanIzgarasi>
            <Alan etiket="Instagram">
              <Girdi
                value={deger.instagram}
                onChange={(olay) => guncelle({ instagram: olay.target.value })}
                placeholder="https://instagram.com/…"
              />
            </Alan>
            <Alan etiket="Facebook">
              <Girdi
                value={deger.facebook}
                onChange={(olay) => guncelle({ facebook: olay.target.value })}
                placeholder="https://facebook.com/…"
              />
            </Alan>
          </AlanIzgarasi>
        )}
      />

      <AyarBolumu
        anahtar="hakkimizda"
        baslik="Hakkımızda sayfası"
        baslangic={ayarlar.hakkimizda}
        cocuklar={(deger, guncelle, hatalar) => (
          <>
            <AlanIzgarasi>
              <Alan etiket="Başlık" hata={hatalar.baslik}>
                <Girdi
                  value={deger.baslik}
                  onChange={(olay) => guncelle({ baslik: olay.target.value })}
                />
              </Alan>
              <Alan etiket="Kuruluş yılı" hata={hatalar.kurulusYili}>
                <Girdi
                  value={String(deger.kurulusYili)}
                  onChange={(olay) =>
                    guncelle({ kurulusYili: Number(olay.target.value) || 0 })
                  }
                  inputMode="numeric"
                  className="rakam"
                />
              </Alan>
            </AlanIzgarasi>

            <Alan etiket="Özet" ipucu="Sayfanın en üstündeki kısa giriş." hata={hatalar.ozet}>
              <MetinKutusu
                value={deger.ozet}
                onChange={(olay) => guncelle({ ozet: olay.target.value })}
                rows={3}
              />
            </Alan>

            <Alan
              etiket="Paragraflar"
              ipucu="Her paragrafı boş bir satır bırakarak ayırın."
            >
              <MetinKutusu
                value={deger.paragraflar.join("\n\n")}
                onChange={(olay) =>
                  guncelle({ paragraflar: olay.target.value.split(/\n\s*\n/) })
                }
                rows={10}
              />
            </Alan>

            <div>
              <p className="mb-2 text-sm font-medium text-murekkep">Değerlerimiz</p>
              <div className="space-y-2">
                {deger.degerler.map((satir, sira) => (
                  <div key={sira} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                    <Girdi
                      value={satir.baslik}
                      onChange={(olay) =>
                        guncelle({
                          degerler: deger.degerler.map((mevcut, i) =>
                            i === sira ? { ...mevcut, baslik: olay.target.value } : mevcut,
                          ),
                        })
                      }
                      placeholder="Başlık"
                      aria-label={`${sira + 1}. değerin başlığı`}
                      className="sm:w-1/3"
                    />
                    <Girdi
                      value={satir.metin}
                      onChange={(olay) =>
                        guncelle({
                          degerler: deger.degerler.map((mevcut, i) =>
                            i === sira ? { ...mevcut, metin: olay.target.value } : mevcut,
                          ),
                        })
                      }
                      placeholder="Açıklama"
                      aria-label={`${sira + 1}. değerin açıklaması`}
                      className="sm:flex-1"
                    />
                    <button
                      type="button"
                      aria-label={`${sira + 1}. değeri kaldır`}
                      onClick={() =>
                        guncelle({ degerler: deger.degerler.filter((_, i) => i !== sira) })
                      }
                      className="mt-0.5 rounded-yumusak p-2.5 text-murekkep-yumusak transition-colors hover:bg-hata/10 hover:text-hata"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Buton
                type="button"
                gorunum="ikincil"
                boyut="kucuk"
                className="mt-2"
                onClick={() =>
                  guncelle({ degerler: [...deger.degerler, { baslik: "", metin: "" }] })
                }
              >
                <Plus className="size-4" />
                Değer ekle
              </Buton>
            </div>
          </>
        )}
      />

      <AyarBolumu
        anahtar="seo"
        baslik="Arama motoru"
        aciklama="Ana sayfanın Google'da görünen başlık ve açıklaması."
        baslangic={ayarlar.seo}
        cocuklar={(deger, guncelle, hatalar) => (
          <>
            <Alan etiket="Site başlığı" hata={hatalar.baslik}>
              <Girdi
                value={deger.baslik}
                onChange={(olay) => guncelle({ baslik: olay.target.value })}
              />
            </Alan>
            <Alan etiket="Site açıklaması" hata={hatalar.aciklama}>
              <MetinKutusu
                value={deger.aciklama}
                onChange={(olay) => guncelle({ aciklama: olay.target.value })}
                rows={3}
              />
            </Alan>
          </>
        )}
      />
    </div>
  );
}
