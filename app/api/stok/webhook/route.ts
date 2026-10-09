import { barkodEsitle } from "@/lib/stok/esitle";
import { imzaGecerli } from "@/lib/stok/imza";

/**
 * POST /api/stok/webhook — Stok Yönetimi'nin product.updated ve stock.changed
 * bildirimleri. İmza doğrulanır; ürün barkodundan stok sisteminden yeniden
 * okunup uygulanır (bildirimdeki değere değil, kaynağın güncel hâline güvenilir).
 * 2xx dışındaki her yanıtı Stok Yönetimi bir süre sonra tekrar dener.
 */
export async function POST(request: Request) {
  const govde = await request.text();
  if (govde.length > 64 * 1024) return new Response("too large", { status: 413 });
  const sir = process.env.STOK_WEBHOOK_SECRET?.trim() ?? "";
  if (!imzaGecerli(sir, request.headers.get("x-stok-timestamp"), request.headers.get("x-stok-signature"), govde)) {
    return new Response("invalid signature", { status: 401 });
  }
  let barkod: string | undefined;
  try {
    const olay = JSON.parse(govde) as { event?: string; data?: { barcode?: string } };
    barkod = olay.data?.barcode;
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  if (!barkod) return Response.json({ ok: true, skipped: true });
  try {
    const sonuc = await barkodEsitle(barkod);
    return Response.json({ ok: true, sonuc });
  } catch (e) {
    console.error("stok webhook", (e as Error).message);
    return new Response("retry later", { status: 503 });
  }
}
