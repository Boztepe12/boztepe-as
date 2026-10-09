import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stok Yönetimi webhook imzası: `X-Stok-Signature: v1=<hex>`, hex =
 * HMAC-SHA256(sır, "<X-Stok-Timestamp>.<ham gövde>"). Beş dakikadan eski ya da
 * ileri tarihli istekler reddedilir (tekrar oynatmaya karşı).
 */
export function imzaGecerli(sir: string, zaman: string | null, imza: string | null, govde: string, simdi = Date.now()): boolean {
  if (!sir || !zaman || !imza || !/^\d+$/.test(zaman)) return false;
  const saniye = Number(zaman);
  if (Math.abs(simdi / 1000 - saniye) > 300) return false;
  const beklenen = "v1=" + createHmac("sha256", sir).update(`${zaman}.${govde}`).digest("hex");
  const a = Buffer.from(beklenen);
  const b = Buffer.from(imza.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}
