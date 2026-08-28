import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { urunler } from "@/lib/db/schema";
import { aktifMarkalar } from "@/lib/sorgular/icerik";
import { tumKategoriSluglari } from "@/lib/sorgular/kategoriler";

const TEMEL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boztepeas.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sabitler: MetadataRoute.Sitemap = [
    { url: TEMEL, changeFrequency: "daily", priority: 1 },
    { url: `${TEMEL}/urunler`, changeFrequency: "daily", priority: 0.9 },
    { url: `${TEMEL}/kampanyalar`, changeFrequency: "daily", priority: 0.9 },
    { url: `${TEMEL}/markalar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${TEMEL}/hakkimizda`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${TEMEL}/galeri`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${TEMEL}/iletisim`, changeFrequency: "yearly", priority: 0.7 },
  ];

  try {
    const [kategoriler, markalar, urunKayitlari] = await Promise.all([
      tumKategoriSluglari(),
      aktifMarkalar(),
      db
        .select({ slug: urunler.slug, guncelleme: urunler.guncellemeTarihi })
        .from(urunler)
        .where(eq(urunler.aktif, true)),
    ]);

    return [
      ...sabitler,
      ...kategoriler.map((k) => ({
        url: `${TEMEL}/kategori/${k.slug}`,
        lastModified: k.guncelleme,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...markalar.map((m) => ({
        url: `${TEMEL}/marka/${m.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...urunKayitlari.map((u) => ({
        url: `${TEMEL}/urun/${u.slug}`,
        lastModified: u.guncelleme,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    /* Veritabanına ulaşılamazsa en azından sabit sayfalar indekslenebilsin. */
    return sabitler;
  }
}
