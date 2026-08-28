import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind sınıflarını çakışmaları çözerek birleştirir. */
export function cn(...girdiler: ClassValue[]) {
  return twMerge(clsx(girdiler));
}

const TURKCE_HARITA: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i", İ: "i", i: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
  â: "a", Â: "a",
  î: "i", Î: "i",
  û: "u", Û: "u",
};

/**
 * Türkçe metni arama/karşılaştırma için sadeleştirir.
 *
 * Standart `toLowerCase()` Türkçe'de yanlış çalışır ("I" → "ı" değil "i" olmalı ki
 * "İSTİKBAL" araması "istikbal" ürününü bulsun), `normalize("NFD")` ise ı/i ayrımını
 * bozar. Bu yüzden harf haritası ile elle dönüştürüyoruz.
 */
export function sadelestir(metin: string): string {
  return metin
    .split("")
    .map((harf) => TURKCE_HARITA[harf] ?? harf)
    .join("")
    .toLowerCase()
    .trim();
}

/** Başlıktan URL'de kullanılabilir slug üretir: "Çamaşır Makinesi" → "camasir-makinesi" */
export function slugOlustur(metin: string): string {
  return sadelestir(metin)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Aranan terim metnin içinde geçiyor mu — Türkçe karakter ve büyük/küçük harf duyarsız. */
export function icerirTurkce(metin: string, aranan: string): boolean {
  return sadelestir(metin).includes(sadelestir(aranan));
}

const TL_BICIMI = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TL_BICIMI_KURUSLU = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Fiyatı Türk Lirası olarak biçimlendirir: 24999 → "24.999 ₺"
 * Mağaza fiyatları yuvarlak olduğu için kuruş varsayılan olarak gizlenir.
 */
export function fiyatBicimle(kurus: number | string | null | undefined, kurusGoster = false): string {
  if (kurus === null || kurus === undefined || kurus === "") return "—";
  const sayi = typeof kurus === "string" ? Number(kurus) : kurus;
  if (!Number.isFinite(sayi)) return "—";
  const bicim = kurusGoster || sayi % 1 !== 0 ? TL_BICIMI_KURUSLU : TL_BICIMI;
  return `${bicim.format(sayi)} ₺`;
}

/** İndirim yüzdesini hesaplar. Geçersiz veya indirimsiz durumda null döner. */
export function indirimYuzdesi(
  fiyat: number | string | null | undefined,
  indirimliFiyat: number | string | null | undefined,
): number | null {
  const asil = typeof fiyat === "string" ? Number(fiyat) : fiyat;
  const indirimli = typeof indirimliFiyat === "string" ? Number(indirimliFiyat) : indirimliFiyat;
  if (!asil || !indirimli) return null;
  if (!Number.isFinite(asil) || !Number.isFinite(indirimli)) return null;
  if (indirimli >= asil) return null;
  return Math.round(((asil - indirimli) / asil) * 100);
}

/** Taksit tutarı: 24000 / 12 → "2.000 ₺ x 12 taksit" */
export function taksitMetni(fiyat: number | string, taksitSayisi: number): string | null {
  const sayi = typeof fiyat === "string" ? Number(fiyat) : fiyat;
  if (!Number.isFinite(sayi) || taksitSayisi < 2) return null;
  return `${fiyatBicimle(sayi / taksitSayisi)} x ${taksitSayisi} taksit`;
}

/** Tarihi "12 Mart 2026" biçiminde yazar. */
export function tarihBicimle(tarih: Date | string | null | undefined): string {
  if (!tarih) return "—";
  const d = typeof tarih === "string" ? new Date(tarih) : tarih;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** Tarihi saat bilgisiyle yazar — admin panelindeki talep listesi için. */
export function tarihSaatBicimle(tarih: Date | string | null | undefined): string {
  if (!tarih) return "—";
  const d = typeof tarih === "string" ? new Date(tarih) : tarih;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

/**
 * Telefon numarasını WhatsApp'ın beklediği biçime çevirir.
 * "0507 464 12 74" → "905074641274"
 */
export function whatsappNumarasi(ham: string): string {
  const rakamlar = ham.replace(/\D/g, "");
  if (rakamlar.startsWith("90")) return rakamlar;
  if (rakamlar.startsWith("0")) return `90${rakamlar.slice(1)}`;
  return `90${rakamlar}`;
}

/** Hazır mesajlı WhatsApp bağlantısı üretir. */
export function whatsappBaglantisi(numara: string, mesaj: string): string {
  return `https://wa.me/${whatsappNumarasi(numara)}?text=${encodeURIComponent(mesaj)}`;
}

/** Telefonu okunur biçimde gösterir: "05074641274" → "0507 464 12 74" */
export function telefonBicimle(ham: string): string {
  const r = ham.replace(/\D/g, "");
  const yerel = r.startsWith("90") ? `0${r.slice(2)}` : r;
  if (yerel.length !== 11) return ham;
  return `${yerel.slice(0, 4)} ${yerel.slice(4, 7)} ${yerel.slice(7, 9)} ${yerel.slice(9)}`;
}

/** Uzun metni belirtilen uzunlukta kırpar, kelime ortasında kesmez. */
export function kisalt(metin: string, uzunluk: number): string {
  if (metin.length <= uzunluk) return metin;
  const kesik = metin.slice(0, uzunluk);
  const sonBosluk = kesik.lastIndexOf(" ");
  return `${(sonBosluk > uzunluk * 0.6 ? kesik.slice(0, sonBosluk) : kesik).trimEnd()}…`;
}

/** IBAN'ı 4'erli gruplar hâlinde okunur yazar. */
export function ibanBicimle(iban: string): string {
  const temiz = iban.replace(/\s/g, "").toUpperCase();
  return temiz.replace(/(.{4})/g, "$1 ").trim();
}
