import { timingSafeEqual } from "node:crypto";

import { esitle } from "@/lib/stok/esitle";

/**
 * GET /api/stok/esitle — günlük güvenlik eşitlemesi (vercel.json crons). Vercel
 * Cron `Authorization: Bearer $CRON_SECRET` gönderir. Anlık güncellemeyi
 * webhook yapar; bu, kaçan bir bildirim olursa onu toplar.
 */
export async function GET(request: Request) {
  const sir = process.env.CRON_SECRET;
  const verilen = request.headers.get("authorization") ?? "";
  const beklenen = `Bearer ${sir}`;
  if (!sir || verilen.length !== beklenen.length || !timingSafeEqual(Buffer.from(verilen), Buffer.from(beklenen))) {
    return new Response("unauthorized", { status: 401 });
  }
  try {
    return Response.json(await esitle());
  } catch (e) {
    return Response.json({ hata: (e as Error).message }, { status: 503 });
  }
}
