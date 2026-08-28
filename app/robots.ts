import type { MetadataRoute } from "next";

const TEMEL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boztepeas.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* Yönetim paneli ve kişiye özel sepet sayfası indekslenmemeli. */
      disallow: ["/admin", "/admin/", "/teklif-sepeti"],
    },
    sitemap: `${TEMEL}/sitemap.xml`,
  };
}
