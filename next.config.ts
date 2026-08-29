import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * PGlite, Postgres'in WASM derlemesini ve veri dosyalarını çalışma anında
   * `new URL(...)` ile çözer. Paketleyici bu dosyaları içeri aldığında yollar
   * bozuluyor ve sorgular "path argument must be of type string" hatasıyla
   * düşüyor. Sunucu paketi olarak dışarıda bırakınca kendi yollarını kendisi
   * çözüyor. Üretimde Neon kullanıldığı için bu ayarın bir maliyeti yok.
   */
  serverExternalPackages: ["@electric-sql/pglite"],

  /*
   * Derleme sırasında Next sayfaları birden çok işçi sürecinde üretiyor. Yerelde
   * veritabanı PGlite ve tek yazıcı olduğu için işçilerin çoğu dizini açamıyor,
   * logda "Aborted()" satırları birikiyor ve hangi sayfanın önceden üretilebileceği
   * şansa kalıyor. `DATABASE_URL` yokken tek işçiyle derliyoruz; üretimde (Neon)
   * böyle bir kısıt olmadığından paralel derleme sürüyor.
   */
  ...(process.env.DATABASE_URL?.trim() ? {} : { experimental: { cpus: 1 } }),

  images: {
    remotePatterns: [
      /* Gerçek fotoğraflar gelene kadar kullanılan yer tutucu servisi. */
      { protocol: "https", hostname: "placehold.co" },
      /* Yönetici panelinden yüklenen görseller. */
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  /* Mobilya ve halı görselleri büyük; sıkıştırma bant genişliğini belirgin düşürüyor. */
  compress: true,

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:yol*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
