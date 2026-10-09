import "server-only";

/**
 * Stok Yönetimi'nin web sitesi API'si (firmanın paneldeki "Web sitesi
 * entegrasyonu" ekranından alınan anahtarla). Ayrıntılı rehber Stok Yönetimi
 * panelinde `/docs/api` adresinde.
 *
 * Ortam değişkenleri (repo herkese açık — değerler yalnızca .env.local ve
 * Vercel'de durur, koda ya da dokümana yazılmaz):
 *   STOK_API_URL         Stok Yönetimi panelinin adresi (ör. https://stok-yonetimi-steel.vercel.app)
 *   STOK_API_KEY         sk_… ile başlayan API anahtarı
 *   STOK_WEBHOOK_SECRET  webhook uç noktasının imza sırrı (whsec_…)
 */

export type StokUrunu = {
  id: string;
  barcode: string;
  removed?: boolean;
  name?: string;
  description?: string | null;
  category?: string | null;
  listPrice?: string;
  vatRate?: string;
  unit?: string;
  available?: boolean;
  imageUrl?: string | null;
  updatedAt?: string;
  stock?: string;
};

export type StokSayfasi = { data: StokUrunu[]; nextOffset: number | null; serverTime: string };

export class StokApiHatasi extends Error {
  constructor(message: string, readonly durum: number | null) {
    super(message);
  }
}

export function stokBaglantisiVar(): boolean {
  return Boolean(process.env.STOK_API_URL?.trim() && process.env.STOK_API_KEY?.trim());
}

async function istek<T>(yol: string): Promise<T> {
  const taban = process.env.STOK_API_URL?.trim().replace(/\/+$/, "");
  const anahtar = process.env.STOK_API_KEY?.trim();
  if (!taban || !anahtar) throw new StokApiHatasi("Stok Yönetimi bağlantısı ayarlanmamış (STOK_API_URL, STOK_API_KEY).", null);
  let yanit: Response;
  try {
    yanit = await fetch(`${taban}/api/v1${yol}`, {
      headers: { Authorization: `Bearer ${anahtar}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new StokApiHatasi("Stok Yönetimi'ne ulaşılamadı.", null);
  }
  if (yanit.status === 401) throw new StokApiHatasi("API anahtarı geçersiz ya da iptal edilmiş.", 401);
  if (yanit.status === 404) throw new StokApiHatasi("Bulunamadı.", 404);
  if (!yanit.ok) throw new StokApiHatasi(`Stok Yönetimi ${yanit.status} döndü.`, yanit.status);
  return (await yanit.json()) as T;
}

/** Değişen ürünler, en eskisi önce; `since` yoksa hepsi. */
export function urunSayfasi(since: string | null, offset: number, limit = 200): Promise<StokSayfasi> {
  const p = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (since) p.set("since", since);
  return istek<StokSayfasi>(`/products?${p}`);
}

/** Tek ürün (`{data}` içinde gelir); yayından kalkmış ya da fiyatsızsa null. */
export async function urunGetir(barkod: string): Promise<StokUrunu | null> {
  try {
    const r = await istek<{ data: StokUrunu }>(`/products/${encodeURIComponent(barkod)}`);
    return r.data.removed ? null : r.data;
  } catch (e) {
    if (e instanceof StokApiHatasi && e.durum === 404) return null;
    throw e;
  }
}

export async function baglantiyiDene(): Promise<{ firma: string }> {
  const r = await istek<{ ok: boolean; firm?: string | { name?: string } }>("/ping");
  const firma = typeof r.firm === "string" ? r.firm : r.firm?.name ?? "";
  return { firma };
}
