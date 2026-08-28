import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

/*
 * Başlıklarda sıcak bir serif, gövdede net bir sans kullanıyoruz — "Sıcak Minimal"
 * dilinin temeli bu karşıtlık. Türkçe metin için `latin-ext` alt kümesi şart;
 * onsuz ğ, ş, ı gibi harfler yedek fontla farklı görünür.
 */
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const siteAdresi = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.boztepeas.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteAdresi),
  title: {
    default: "Boztepe A.Ş. — Malatya Beyaz Eşya, Mobilya ve Halı Mağazası",
    template: "%s — Boztepe A.Ş.",
  },
  description:
    "1963'ten beri Malatya'da beyaz eşya, mobilya ve halı. Vestel yetkili bayisi. " +
    "Güncel fiyatlar, indirimler ve taksit seçenekleriyle.",
  applicationName: "Boztepe A.Ş.",
  authors: [{ name: "Boztepe Ev Gereçleri İnşaat San. Tic. A.Ş." }],
  keywords: [
    "Malatya beyaz eşya",
    "Malatya mobilya",
    "Malatya halı",
    "Vestel bayi Malatya",
    "Boztepe",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Boztepe A.Ş.",
    url: siteAdresi,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, address: true },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
};

export default function KokYerlesim({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-yuzey)",
              color: "var(--color-murekkep)",
              border: "1px solid var(--color-cizgi)",
              borderRadius: "var(--radius-kart)",
              fontFamily: "var(--font-govde)",
            },
          }}
        />
      </body>
    </html>
  );
}
