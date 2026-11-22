"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, FileText, Link2, Save, Upload } from "lucide-react";

import { Panel } from "@/components/admin/panel-parcalari";
import { Buton, ButonBaglanti } from "@/components/ui/buton";
import { Alan, AlanIzgarasi, Girdi, MetinKutusu, Onay } from "@/components/ui/form";
import { katalogKaydet, katalogPdfYuklemeHazirla } from "@/lib/eylemler/admin/kataloglar";
import { cn } from "@/lib/utils";

export type FormKatalogu = {
  id: number;
  baslik: string;
  grup: string | null;
  aciklama: string | null;
  tur: "pdf" | "baglanti";
  baglanti: string | null;
  dosyaKimligi: string | null;
  dosyaAdi: string | null;
  dosyaBoyutu: number | null;
  sira: number;
  aktif: boolean;
};

type Dosya = { url: string; kimlik: string; ad: string; boyut: number };

export function boyutMetni(bayt: number | null | undefined): string {
  if (!bayt) return "";
  return bayt >= 1024 * 1024 ? `${(bayt / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bayt / 1024))} KB`;
}

/**
 * PDF'i yükler. Canlıda sunucu tek kullanımlık bir yükleme adresi verir ve dosya
 * tarayıcıdan doğrudan depoya (Supabase Storage) gider — sunucudan geçmez, büyük
 * PDF'ler de yüklenir. Yerelde geliştirme rotasına gönderilir.
 */
async function pdfYukle(dosya: File): Promise<Dosya> {
  if (!(dosya.type === "application/pdf" || dosya.name.toLowerCase().endsWith(".pdf"))) {
    throw new Error("Yalnızca PDF dosyası yükleyebilirsiniz.");
  }
  if (dosya.size > 50 * 1024 * 1024) throw new Error("PDF en fazla 50 MB olabilir.");
  const hazir = await katalogPdfYuklemeHazirla();
  if (!hazir.yerel) {
    const yanit = await fetch(hazir.yuklemeAdresi, {
      method: "PUT",
      headers: { "content-type": "application/pdf", "x-upsert": "false", "cache-control": "max-age=31536000" },
      body: dosya,
    });
    if (!yanit.ok) {
      const govde = (await yanit.json().catch(() => ({}))) as { message?: string; error?: string };
      throw new Error(`Yüklenemedi: ${govde.message ?? govde.error ?? yanit.status}`);
    }
    return { url: hazir.url, kimlik: hazir.kimlik, ad: dosya.name, boyut: dosya.size };
  }
  const govde = new FormData();
  govde.append("dosya", dosya);
  const yanit = await fetch("/api/admin/katalog-pdf", { method: "POST", body: govde });
  const sonuc = (await yanit.json().catch(() => ({}))) as { url?: string; kimlik?: string; ad?: string; boyut?: number; hata?: string };
  if (!yanit.ok || !sonuc.url || !sonuc.kimlik) throw new Error(sonuc.hata ?? "Dosya yüklenemedi.");
  return { url: sonuc.url, kimlik: sonuc.kimlik, ad: sonuc.ad ?? dosya.name, boyut: sonuc.boyut ?? dosya.size };
}

export function KatalogKayitFormu({ katalog, gruplar = [] }: { katalog?: FormKatalogu; gruplar?: string[] }) {
  const router = useRouter();
  const secici = useRef<HTMLInputElement>(null);
  const [deger, setDeger] = useState({
    baslik: katalog?.baslik ?? "",
    grup: katalog?.grup ?? "",
    aciklama: katalog?.aciklama ?? "",
    tur: katalog?.tur ?? ("pdf" as "pdf" | "baglanti"),
    adres: katalog?.tur === "baglanti" ? (katalog.baglanti ?? "") : "",
    sira: String(katalog?.sira ?? 0),
    aktif: katalog?.aktif ?? true,
  });
  const [dosya, setDosya] = useState<Dosya | null>(
    katalog?.tur === "pdf" && katalog.baglanti && katalog.dosyaKimligi
      ? { url: katalog.baglanti, kimlik: katalog.dosyaKimligi, ad: katalog.dosyaAdi ?? "katalog.pdf", boyut: katalog.dosyaBoyutu ?? 0 }
      : null,
  );
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [kaydediliyor, basla] = useTransition();

  function hatayiSil(alan: string) {
    setHatalar((onceki) => {
      const kalan = { ...onceki };
      delete kalan[alan];
      return kalan;
    });
  }

  function guncelle<T extends keyof typeof deger>(alan: T, yeni: (typeof deger)[T]) {
    setDeger((onceki) => ({ ...onceki, [alan]: yeni }));
    if (hatalar[alan]) hatayiSil(alan);
  }

  async function dosyaSecildi(secilen: File | undefined) {
    if (!secilen) return;
    setYukleniyor(true);
    try {
      setDosya(await pdfYukle(secilen));
      hatayiSil("dosya");
      toast.success("PDF yüklendi. Kaydetmeyi unutmayın.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setYukleniyor(false);
      if (secici.current) secici.current.value = "";
    }
  }

  function kaydet() {
    basla(async () => {
      try {
        const pdf = deger.tur === "pdf";
        const sonuc = await katalogKaydet({
          id: katalog?.id,
          baslik: deger.baslik,
          grup: deger.grup,
          aciklama: deger.aciklama,
          tur: deger.tur,
          baglanti: pdf ? (dosya?.url ?? null) : deger.adres,
          dosyaKimligi: pdf ? (dosya?.kimlik ?? null) : null,
          dosyaAdi: pdf ? (dosya?.ad ?? null) : null,
          dosyaBoyutu: pdf ? (dosya?.boyut ?? null) : null,
          sira: deger.sira,
          aktif: deger.aktif,
        });
        if (sonuc.durum === "hata") {
          setHatalar(sonuc.alanlar ?? {});
          toast.error(sonuc.mesaj);
          return;
        }
        setHatalar({});
        toast.success(sonuc.mesaj ?? "Kaydedildi.");
        if (katalog) router.refresh();
        else if (sonuc.id) router.push(`/admin/kataloglar/${sonuc.id}`);
      } catch {
        toast.error("Kaydedilemedi. Oturumunuz sona ermiş olabilir, sayfayı yenileyip deneyin.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Panel baslik="Katalog">
        <div className="space-y-4 p-5">
          <AlanIzgarasi>
            <Alan etiket="Başlık" zorunlu hata={hatalar.baslik} ipucu="Genelde marka adı: Venti, Castor, Hendi 2021…">
              <Girdi value={deger.baslik} onChange={(o) => guncelle("baslik", o.target.value)} autoFocus={!katalog} />
            </Alan>
            <Alan etiket="Grup" ipucu="Sayfada başlık olarak görünür: Mobilya, Beyaz Eşya, Halı…" hata={hatalar.grup}>
              <Girdi value={deger.grup} onChange={(o) => guncelle("grup", o.target.value)} list="katalog-gruplari" />
              <datalist id="katalog-gruplari">
                {gruplar.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </Alan>
          </AlanIzgarasi>

          <Alan etiket="Kısa açıklama" hata={hatalar.aciklama}>
            <MetinKutusu value={deger.aciklama} onChange={(o) => guncelle("aciklama", o.target.value)} rows={2}
              placeholder="İsteğe bağlı: 2026 koleksiyonu, yemek odası takımları…" />
          </Alan>

          <div>
            <p className="mb-2 text-sm font-medium text-murekkep">Katalog nereden açılsın?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { tur: "pdf", baslik: "PDF dosyası", alt: "Dosyayı buraya yükleyin", simge: FileText },
                { tur: "baglanti", baslik: "Web sitesi", alt: "Markanın online kataloğu", simge: Link2 },
              ] as const).map((s) => (
                <button
                  key={s.tur}
                  type="button"
                  onClick={() => guncelle("tur", s.tur)}
                  aria-pressed={deger.tur === s.tur}
                  className={cn(
                    "flex items-center gap-3 rounded-kart border p-3 text-left transition-colors",
                    deger.tur === s.tur ? "border-kiremit bg-kiremit/5" : "border-cizgi hover:bg-kum",
                  )}
                >
                  <s.simge className={cn("size-5", deger.tur === s.tur ? "text-kiremit" : "text-solgun")} />
                  <span>
                    <span className="block text-sm font-medium text-murekkep">{s.baslik}</span>
                    <span className="block text-xs text-solgun">{s.alt}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {deger.tur === "pdf" ? (
            <Alan etiket="PDF dosyası" zorunlu hata={hatalar.dosya}>
              <div className="flex flex-wrap items-center gap-3 rounded-kart border border-dashed border-cizgi-koyu p-4">
                {dosya ? (
                  <a href={dosya.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-2 text-sm text-murekkep hover:text-kiremit">
                    <FileText className="size-4 shrink-0" />
                    <span className="truncate">{dosya.ad}</span>
                    <span className="rakam shrink-0 text-xs text-solgun">{boyutMetni(dosya.boyut)}</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-sm text-solgun">Henüz dosya seçilmedi.</span>
                )}
                <Buton type="button" gorunum="ikincil" boyut="kucuk" disabled={yukleniyor} onClick={() => secici.current?.click()} className="ml-auto">
                  <Upload className="size-4" /> {yukleniyor ? "Yükleniyor…" : dosya ? "Değiştir" : "PDF seç"}
                </Buton>
                <input ref={secici} type="file" accept="application/pdf,.pdf" className="hidden"
                  onChange={(o) => dosyaSecildi(o.target.files?.[0])} />
              </div>
            </Alan>
          ) : (
            <Alan etiket="Katalog adresi" zorunlu hata={hatalar.baglanti} ipucu="Ör. https://www.slims.com.tr/slims/ — ziyaretçi yeni sekmede açar.">
              <Girdi value={deger.adres} onChange={(o) => guncelle("adres", o.target.value)} placeholder="https://" inputMode="url" />
            </Alan>
          )}

          <AlanIzgarasi>
            <Alan etiket="Sıra" ipucu="Küçük sayı önce görünür.">
              <Girdi value={deger.sira} onChange={(o) => guncelle("sira", o.target.value)} inputMode="numeric" className="rakam" />
            </Alan>
            <div className="flex items-end pb-2">
              <Onay checked={deger.aktif} onChange={(o) => guncelle("aktif", o.target.checked)} etiket="Sitede yayında" />
            </div>
          </AlanIzgarasi>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ButonBaglanti href="/admin/kataloglar" gorunum="sessiz">
          Vazgeç
        </ButonBaglanti>
        <Buton type="button" onClick={kaydet} disabled={kaydediliyor || yukleniyor}>
          <Save className="size-4" />
          {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
        </Buton>
      </div>
    </div>
  );
}
